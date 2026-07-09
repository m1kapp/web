import { redis } from "@/lib/redis";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
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
const ACTIVE_SITES_KEY = "hit:active-sites";
const SITE_CACHE_KEY = (slug: string) => `site:${slug}`;
const COUNT_SNAPSHOT_KEY = (siteId: number) => `counts:${siteId}`;
const VERIFY_QUEUE_KEY = "verify:queue";


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
      pipe.sadd(ACTIVE_SITES_KEY, `${entry.siteId}:${entry.date}`);
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

/** flush 후 카운트 키 초기화 */
export async function clearFlushedKeys(entries: { siteId: number; date: string }[]): Promise<void> {
  if (!redis || entries.length === 0) return;
  try {
    const pipe = redis.pipeline();
    const seen = new Set<string>();
    for (const e of entries) {
      const hk = HIT_COUNT_KEY(e.siteId, e.date);
      if (!seen.has(hk)) { pipe.del(hk); seen.add(hk); }
      const tk = TOTAL_KEY(e.siteId);
      if (!seen.has(tk)) { pipe.del(tk); seen.add(tk); }
    }
    pipe.del(ACTIVE_SITES_KEY);
    await pipe.exec();
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

// ─── verify 큐 (badge에서 Neon 쓰기 대신 큐에 넣고 flush에서 처리) ─

export async function queueVerify(siteId: number, slug: string): Promise<void> {
  if (redis) {
    try {
      await redis.sadd(VERIFY_QUEUE_KEY, JSON.stringify({ siteId, slug }));
      return;
    } catch (e) {
      console.warn("[hit-buffer] Redis queueVerify failed, writing directly:", e);
    }
  }
  // Neon 폴백: 직접 verified 업데이트
  await db.update(sites).set({ verified: true }).where(eq(sites.id, siteId));
}

export async function drainVerifyQueue(): Promise<{ siteId: number; slug: string }[]> {
  if (!redis) return [];
  try {
    const members = await redis.smembers(VERIFY_QUEUE_KEY);
    if (members.length > 0) await redis.del(VERIFY_QUEUE_KEY);
    return members.map((m: unknown) => (typeof m === "string" ? JSON.parse(m) : m) as { siteId: number; slug: string });
  } catch (e) {
    console.warn("[hit-buffer] Redis drainVerifyQueue failed:", e);
    return [];
  }
}
