import { todayKST } from "@/lib/format";
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
      return await redis.eval(`
        if not redis.call('SET', KEYS[1], 1, 'NX', 'EX', 86400) then return 0 end
        redis.call('HINCRBY', KEYS[2], 'count', 1)
        redis.call('INCRBY', KEYS[3], 1)
        redis.call('LPUSH', KEYS[4], ARGV[1])
        return 1
      `, [DEDUP_KEY(entry.siteId, entry.ipHash), HIT_COUNT_KEY(entry.siteId, entry.date),
        TOTAL_KEY(entry.siteId), LOG_LIST_KEY], [JSON.stringify(entry)]) === 1;
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

/** 성공 확인 전에는 큐를 비우지 않는다. 새 방문은 LPUSH라 읽은 꼬리는 유지된다. */
export async function readPendingHits(batchSize = 1000) {
  if (!redis) return { raw: [], entries: [] };
  const values = await redis.lrange<string | HitEntry>(LOG_LIST_KEY, -batchSize, -1);
  const raw = values.map((v) => typeof v === "string" ? v : JSON.stringify(v));
  return { raw, entries: raw.map((v) => JSON.parse(v) as HitEntry) };
}

const ACK_HITS_SCRIPT = `
local raw = cjson.decode(ARGV[1])
local queued = redis.call('LRANGE', KEYS[1], -#raw, -1)
if #queued ~= #raw then return 0 end
for i, value in ipairs(raw) do
  if queued[i] ~= value then return 0 end
end
local deltas = cjson.decode(ARGV[2])
for i, delta in ipairs(deltas) do
  local key = KEYS[i + 1]
  local left
  if delta.hash then left = redis.call('HINCRBY', key, 'count', -delta.n)
  else left = redis.call('DECRBY', key, delta.n) end
  if left <= 0 then redis.call('DEL', key) end
end
for i, update in ipairs(cjson.decode(ARGV[3])) do
  redis.call('SET', KEYS[#deltas + 1 + i], update.value, 'EX', update.ttl)
end
redis.call('LTRIM', KEYS[1], 0, -#raw - 1)
return 1
`;

/** 큐 삭제·버퍼 차감·DB 스냅샷 공개를 한 번에 반영한다. */
export async function acknowledgeHits(
  batch: { raw: string[]; entries: HitEntry[] },
  snapshots: { siteId: number; slug: string; site: unknown; snapshot: CountSnapshot }[],
): Promise<boolean> {
  if (!redis || batch.raw.length === 0) return false;
  const counters = new Map<string, { n: number; hash: boolean }>();
  for (const e of batch.entries) {
    for (const [key, hash] of [[HIT_COUNT_KEY(e.siteId, e.date), true], [TOTAL_KEY(e.siteId), false]] as const) {
      const counter = counters.get(key);
      if (counter) counter.n++;
      else counters.set(key, { n: 1, hash });
    }
  }
  const keys = [LOG_LIST_KEY, ...counters.keys()];
  const updates: { value: string; ttl: number }[] = [];
  for (const s of snapshots) {
    keys.push(COUNT_SNAPSHOT_KEY(s.siteId), SITE_CACHE_KEY(s.slug));
    updates.push({ value: JSON.stringify(s.snapshot), ttl: 90_000 }, { value: JSON.stringify(s.site), ttl: 3600 });
  }
  return await redis.eval(ACK_HITS_SCRIPT, keys, [
    JSON.stringify(batch.raw), JSON.stringify([...counters.values()]), JSON.stringify(updates),
  ]) === 1;
}

/**
 * 사이트 삭제 시 Redis에 남는 잔여 키를 지운다.
 *
 * 안 지우면 같은 URL을 다시 등록했을 때 새 siteId를 받으므로 카운트가 섞이진
 * 않지만, 총합/스냅샷 키가 영영 남아 메모리를 먹는다. 날짜별 `hits:<id>:<date>`
 * 는 개수를 모르므로 오늘부터 과거 `days`일만 훑는다(그 이전은 이미 flush돼
 * 지워졌을 가능성이 높다). dedup 키는 TTL 24h라 자연 소멸.
 */
export async function purgeSiteBuffers(siteId: number, slug: string, days = 40): Promise<void> {
  if (!redis) return;
  try {
    const pipe = redis.pipeline();
    pipe.del(TOTAL_KEY(siteId));
    pipe.del(COUNT_SNAPSHOT_KEY(siteId));
    pipe.del(SITE_CACHE_KEY(slug));
    const day = new Date();
    for (let i = 0; i < days; i++) {
      pipe.del(HIT_COUNT_KEY(siteId, day.toISOString().slice(0, 10)));
      day.setDate(day.getDate() - 1);
    }
    await pipe.exec();
  } catch (e) {
    console.warn("[hit-buffer] Redis purgeSiteBuffers failed:", e);
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
      const snapshot = await redis.get<CountSnapshot>(COUNT_SNAPSHOT_KEY(siteId));
      if (snapshot && todayKST(new Date(snapshot.updatedAt)) === todayKST()) return snapshot;
      const fresh = await directGetCountSnapshot(siteId);
      if (fresh) await saveCountSnapshot(siteId, fresh);
      return fresh;
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
