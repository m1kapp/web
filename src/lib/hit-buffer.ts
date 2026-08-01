import { redis } from "@/lib/redis";
import { directWriteHit, directGetCountSnapshot } from "./hit-direct";

export interface HitEntry {
  siteId: number;
  ipHash: string;
  country: string | null;
  city: string | null;
  device: string;
  browser: string;
  os: string;
  referer: string | null;
  date: string;      // YYYY-MM-DD (KST)
  hourKST: number;
}

/** flush 크론이 저장하는 카운트 스냅샷 */
export interface CountSnapshot {
  total: number;
  today: number;
  weekly: number;
  monthly: number;
  updatedAt: string; // ISO
}

const DEDUP_KEY = (siteId: number, ipHash: string) => `dedup:${siteId}:${ipHash}`;
const HIT_COUNT_KEY = (siteId: number, date: string) => `hits:${siteId}:${date}`;
const TOTAL_KEY = (siteId: number) => `total:${siteId}`;
const LOG_LIST_KEY = "hit:logs";
const SITE_CACHE_KEY = (slug: string) => `site:${slug}`;
const COUNT_SNAPSHOT_KEY = (siteId: number) => `counts:${siteId}`;


// ─── 공개 API (Redis 우선, 실패 시 Neon 폴백) ─────────────────────────

/** IP 중복 체크 후 버퍼에 기록. 중복이면 false 반환 */
export async function bufferHit(entry: HitEntry): Promise<boolean> {
  if (redis) {
    try {
      const isNew = await redis.set(DEDUP_KEY(entry.siteId, entry.ipHash), 1, { nx: true, ex: 86400 });
      if (!isNew) return false;

      const pipe = redis.pipeline();
      pipe.hincrby(HIT_COUNT_KEY(entry.siteId, entry.date), "count", 1);
      pipe.incrby(TOTAL_KEY(entry.siteId), 1);
      pipe.lpush(LOG_LIST_KEY, JSON.stringify(entry));
      await pipe.exec();
      return true;
    } catch (e) {
      console.warn("[hit-buffer] Redis bufferHit failed, falling back to Neon:", e);
    }
  }
  return directWriteHit(entry);
}

/** 버퍼된 오늘 카운트 조회 (badge 표시용) */
export async function getBufferedCount(siteId: number, date: string): Promise<number> {
  if (redis) {
    try {
      const val = await redis.hget<number>(HIT_COUNT_KEY(siteId, date), "count");
      return val ?? 0;
    } catch (e) {
      console.warn("[hit-buffer] Redis getBufferedCount failed:", e);
    }
  }
  return 0; // Neon 폴백 시 데이터가 이미 DB에 있으므로 0
}

/** 버퍼된 total 증분 조회 */
export async function getBufferedTotal(siteId: number): Promise<number> {
  if (redis) {
    try {
      const val = await redis.get<number>(TOTAL_KEY(siteId));
      return val ?? 0;
    } catch (e) {
      console.warn("[hit-buffer] Redis getBufferedTotal failed:", e);
    }
  }
  return 0; // Neon 폴백 시 데이터가 이미 DB에 있으므로 0
}

/** 여러 사이트의 버퍼된 today/total을 파이프라인 1왕복으로 조회.
 *  flush 크론 주기 전에 생긴 신규 hit은 Postgres hits 테이블엔 아직 없고
 *  Redis 버퍼에만 있어서, 목록 집계 시 이걸 안 더하면 배지(count 뷰)와 값이 어긋남. */
export async function getBufferedMap(siteIds: number[], date: string): Promise<Map<number, { today: number; total: number }>> {
  const out = new Map<number, { today: number; total: number }>();
  if (!redis || siteIds.length === 0) return out;
  try {
    const pipe = redis.pipeline();
    for (const id of siteIds) {
      pipe.hget<number>(HIT_COUNT_KEY(id, date), "count");
      pipe.get<number>(TOTAL_KEY(id));
    }
    const results = await pipe.exec<number[]>();
    siteIds.forEach((id, i) => {
      const today = (results[i * 2] as number | null) ?? 0;
      const total = (results[i * 2 + 1] as number | null) ?? 0;
      out.set(id, { today, total });
    });
  } catch (e) {
    console.warn("[hit-buffer] Redis getBufferedMap failed:", e);
  }
  return out;
}

/** flush: 로그 전부 꺼내기 (최대 batchSize개) — count 인자로 한 번에 배치 팝 (왕복 1회) */
export async function drainLogs(batchSize = 500): Promise<HitEntry[]> {
  if (!redis) return [];
  try {
    const raw = await redis.rpop<string[]>(LOG_LIST_KEY, batchSize);
    if (!raw) return [];
    return raw.map((r) => (typeof r === "string" ? JSON.parse(r) : r) as HitEntry);
  } catch (e) {
    console.warn("[hit-buffer] Redis drainLogs failed:", e);
    return [];
  }
}

/** flush 후 카운트 키에서 **비운 만큼만** 뺀다.
 *
 * 예전엔 del 로 통째 지웠는데, drain 은 배치 상한에서 끊기고 flush 의 DB 작업은
 * 순차 await 이 수십 번이라 초 단위다. 그 사이 들어온 히트와 이번에 못 비운
 * 백로그의 카운터까지 같이 날아갔다 — 로그는 남아 있어 손실은 아니지만 다음
 * 크론(하루 1회)까지 배지·대시보드가 과소 표시됐다. */
export async function clearFlushedKeys(entries: { siteId: number; date: string }[]): Promise<void> {
  if (!redis || entries.length === 0) return;

  const byDay = new Map<string, { siteId: number; date: string; n: number }>();
  const bySite = new Map<number, number>();
  for (const e of entries) {
    const k = `${e.siteId}:${e.date}`;
    const cur = byDay.get(k);
    if (cur) cur.n++;
    else byDay.set(k, { siteId: e.siteId, date: e.date, n: 1 });
    bySite.set(e.siteId, (bySite.get(e.siteId) ?? 0) + 1);
  }

  try {
    const pipe = redis.pipeline();
    const keys: string[] = [];
    for (const d of byDay.values()) {
      pipe.hincrby(HIT_COUNT_KEY(d.siteId, d.date), "count", -d.n);
      keys.push(HIT_COUNT_KEY(d.siteId, d.date));
    }
    for (const [siteId, n] of bySite) {
      pipe.decrby(TOTAL_KEY(siteId), n);
      keys.push(TOTAL_KEY(siteId));
    }
    const res = await pipe.exec<number[]>();

    // 0 이하로 내려간 키는 지운다 — 안 지우면 날짜별 키가 0인 채로 계속 쌓인다.
    const empty = keys.filter((_, i) => Number(res[i] ?? 0) <= 0);
    if (empty.length > 0) {
      const cleanup = redis.pipeline();
      for (const k of empty) cleanup.del(k);
      await cleanup.exec();
    }
  } catch (e) {
    console.warn("[hit-buffer] Redis clearFlushedKeys failed:", e);
  }
}

// ─── site 캐싱 ──────────────────────────────────────────────────────

/** site 데이터를 KV에서 조회. 없으면 null (호출자가 Neon fallback) */
export async function getCachedSite<T>(slug: string): Promise<T | null> {
  if (!redis) return null;
  try {
    return await redis.get<T>(SITE_CACHE_KEY(slug));
  } catch (e) {
    console.warn("[hit-buffer] Redis getCachedSite failed:", e);
    return null;
  }
}

/** site 데이터를 KV에 캐싱 (1시간 TTL) */
export async function cacheSite<T>(slug: string, site: T): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(SITE_CACHE_KEY(slug), site, { ex: 3600 });
  } catch (e) {
    console.warn("[hit-buffer] Redis cacheSite failed:", e);
  }
}

// ─── 카운트 스냅샷 (flush 시 Neon에서 읽어 KV에 저장) ──────────────

/** 스냅샷 저장 (flush 크론에서 호출) */
export async function saveCountSnapshot(siteId: number, snapshot: CountSnapshot): Promise<void> {
  if (!redis) return;
  try {
    // TTL 25h — flush 크론이 하루 1회(vercel.json)라 2h TTL이면 하루 대부분 스냅샷이
    // 만료돼 weekly/monthly가 부정확해짐. 크론 주기 + 여유 1h
    await redis.set(COUNT_SNAPSHOT_KEY(siteId), snapshot, { ex: 90_000 });
  } catch (e) {
    console.warn("[hit-buffer] Redis saveCountSnapshot failed:", e);
  }
}

/** 스냅샷 조회 — Redis 없으면 Neon에서 직접 계산 */
export async function getCountSnapshot(siteId: number): Promise<CountSnapshot | null> {
  if (redis) {
    try {
      return await redis.get<CountSnapshot>(COUNT_SNAPSHOT_KEY(siteId));
    } catch (e) {
      console.warn("[hit-buffer] Redis getCountSnapshot failed:", e);
    }
  }
  return directGetCountSnapshot(siteId);
}

// verify 큐(queueVerify/drainVerifyQueue)는 지웠다. 부르는 곳이 한 군데도 없어
// flush 크론의 처리 단계가 통째로 죽은 코드였고, 주석이 말하던 설계("badge에서
// Neon 쓰기 대신 큐에 넣고 flush에서 처리")와 실제 구현이 반대였다 — 배지
// 라우트가 verifyByReferer 로 Neon 을 직접 친다. 인증은 첫 방문 즉시 붙어야
// 사용자가 "뱃지를 심으면 추적이 시작돼요"를 안 보므로, 직접 쓰기 쪽을 남겼다.
