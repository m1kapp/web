import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hits, hitLogs, sites, dailyGeoStats, dailyDeviceStats, dailyHourStats } from "@/lib/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import {
  drainLogs, clearFlushedKeys, saveCountSnapshot, drainVerifyQueue,
  cacheSite, type HitEntry,
} from "@/lib/hit-buffer";
import { todayKST } from "@/lib/format";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // ── 1. verify 큐 처리 ─────────────────────────────────────────────
  const verifyItems = await drainVerifyQueue();
  for (const { siteId, slug } of verifyItems) {
    const updated = await db.update(sites)
      .set({ verified: true })
      .where(eq(sites.id, siteId))
      .returning();
    if (updated[0]) await cacheSite(slug, updated[0]);
  }

  // ── 2. 버퍼 로그 drain → 집계 테이블 반영 ─────────────────────────
  // 배치가 가득 차면 백로그가 남은 것 — 다 빌 때까지 반복 (크론 하루 1회라 캡 걸면 영구 누적)
  const entries: HitEntry[] = [];
  for (let round = 0; round < 20; round++) {
    const batch = await drainLogs(1000);
    entries.push(...batch);
    if (batch.length < 1000) break;
  }
  if (entries.length === 0 && verifyItems.length === 0) {
    return Response.json({ flushed: 0, verified: 0 });
  }

  if (entries.length > 0) {
    await flushEntries(entries);
  }
  // NOTE: hitLogs 보존정책(90일 삭제)은 referer 통계가 hitLogs 풀스캔에 의존하는 동안 불가 —
  // dailyRefererStats 사전집계 테이블 도입 후에 켤 것

  // ── 3. 카운트 스냅샷 갱신 + milestone 체크 ────────────────────────
  const affectedSiteIds = [...new Set(entries.map((e) => e.siteId))];
  for (const siteId of affectedSiteIds) {
    await refreshSnapshot(siteId);
  }

  return Response.json({ flushed: entries.length, verified: verifyItems.length, snapshots: affectedSiteIds.length });
}

/** entries를 keyOf로 묶어 count 집계 */
function groupCount<T extends { count: number }>(
  entries: HitEntry[],
  keyOf: (e: HitEntry) => string,
  init: (e: HitEntry) => T
): T[] {
  const map = new Map<string, T>();
  for (const e of entries) {
    const cur = map.get(keyOf(e));
    if (cur) cur.count++;
    else map.set(keyOf(e), init(e));
  }
  return [...map.values()];
}

/** 버퍼 로그를 hitLogs·hits·sites.totalHits·일별 통계 테이블에 반영 */
async function flushEntries(entries: HitEntry[]) {
  // hitLogs 일괄 삽입
  await db.insert(hitLogs).values(
    entries.map((e) => ({
      siteId: e.siteId,
      ipHash: e.ipHash,
      country: e.country,
      city: e.city,
      device: e.device,
      browser: e.browser,
      os: e.os,
      referer: e.referer,
    }))
  );

  // hits (일별 카운트)
  const hitAgg = groupCount(entries,
    (e) => `${e.siteId}:${e.date}`,
    (e) => ({ siteId: e.siteId, date: e.date, count: 1 }));
  for (const h of hitAgg) {
    await db.insert(hits).values(h)
      .onConflictDoUpdate({ target: [hits.siteId, hits.date], set: { count: sql`${hits.count} + ${h.count}` } });
  }

  // sites.totalHits
  const totalAgg = groupCount(entries,
    (e) => String(e.siteId),
    (e) => ({ siteId: e.siteId, count: 1 }));
  for (const t of totalAgg) {
    await db.update(sites).set({ totalHits: sql`${sites.totalHits} + ${t.count}` }).where(eq(sites.id, t.siteId));
  }

  // dailyGeoStats
  const geoAgg = groupCount(entries,
    (e) => `${e.siteId}:${e.date}:${e.country ?? ""}:${e.city ?? ""}`,
    (e) => ({ siteId: e.siteId, date: e.date, country: e.country ?? "", city: e.city ?? "", count: 1 }));
  for (const g of geoAgg) {
    await db.insert(dailyGeoStats).values(g)
      .onConflictDoUpdate({
        target: [dailyGeoStats.siteId, dailyGeoStats.date, dailyGeoStats.country, dailyGeoStats.city],
        set: { count: sql`${dailyGeoStats.count} + ${g.count}` },
      });
  }

  // dailyDeviceStats
  const devAgg = groupCount(entries,
    (e) => `${e.siteId}:${e.date}:${e.device}:${e.browser}:${e.os}`,
    (e) => ({ siteId: e.siteId, date: e.date, device: e.device, browser: e.browser, os: e.os, count: 1 }));
  for (const d of devAgg) {
    await db.insert(dailyDeviceStats).values(d)
      .onConflictDoUpdate({
        target: [dailyDeviceStats.siteId, dailyDeviceStats.date, dailyDeviceStats.device, dailyDeviceStats.browser, dailyDeviceStats.os],
        set: { count: sql`${dailyDeviceStats.count} + ${d.count}` },
      });
  }

  // dailyHourStats
  const hourAgg = groupCount(entries,
    (e) => `${e.siteId}:${e.date}:${e.hourKST}`,
    (e) => ({ siteId: e.siteId, date: e.date, hour: e.hourKST, count: 1 }));
  for (const h of hourAgg) {
    await db.insert(dailyHourStats).values(h)
      .onConflictDoUpdate({
        target: [dailyHourStats.siteId, dailyHourStats.date, dailyHourStats.hour],
        set: { count: sql`${dailyHourStats.count} + ${h.count}` },
      });
  }

  // Redis 카운트 키 정리
  await clearFlushedKeys(entries);
}

/** 사이트 하나의 KV 카운트 스냅샷·milestone·site 캐시 갱신 */
async function refreshSnapshot(siteId: number) {
  const now = new Date();
  const todayStr = todayKST(now);
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30);

  const [siteRow, [todayR], [weeklyR], [monthlyR]] = await Promise.all([
    db.query.sites.findFirst({ where: eq(sites.id, siteId) }),
    db.select({ v: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, siteId), eq(hits.date, todayStr))),
    db.select({ v: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, siteId), gte(hits.date, todayKST(weekAgo)))),
    db.select({ v: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, siteId), gte(hits.date, todayKST(monthAgo)))),
  ]);

  if (!siteRow) return;

  await saveCountSnapshot(siteId, {
    total: siteRow.totalHits,
    today: Number(todayR.v),
    weekly: Number(weeklyR.v),
    monthly: Number(monthlyR.v),
    updatedAt: new Date().toISOString(),
  });

  // milestone 체크
  if (siteRow.totalHits >= 1000 && !siteRow.reached1000At) {
    await db.update(sites).set({ reached1000At: new Date() }).where(eq(sites.id, siteId));
  }

  // site 캐시도 갱신
  if (siteRow.slug) await cacheSite(siteRow.slug, siteRow);
}
