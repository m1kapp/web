import { db } from "@/lib/db";
import { hits, hitLogs, sites, dailyGeoStats, dailyDeviceStats, dailyHourStats } from "@/lib/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import { todayKST } from "@/lib/format";
import type { HitEntry, CountSnapshot } from "./hit-buffer";

// ─── Neon 직접 쓰기 (Redis 없을 때 폴백) ─────────────────────────────

export async function directWriteHit(entry: HitEntry): Promise<boolean> {
  // IP 중복 체크: hitLogs에서 오늘 같은 ipHash가 있는지 확인
  const todayStart = new Date(`${entry.date}T00:00:00+09:00`);
  const existing = await db.select({ id: hitLogs.id })
    .from(hitLogs)
    .where(and(
      eq(hitLogs.siteId, entry.siteId),
      eq(hitLogs.ipHash, entry.ipHash),
      gte(hitLogs.createdAt, todayStart),
    ))
    .limit(1);
  if (existing.length > 0) return false;

  // hitLogs 삽입
  await db.insert(hitLogs).values({
    siteId: entry.siteId,
    ipHash: entry.ipHash,
    country: entry.country,
    city: entry.city,
    device: entry.device,
    browser: entry.browser,
    os: entry.os,
    referer: entry.referer,
  });

  // hits (일별 카운트) + sites.totalHits + 통계 테이블 병렬 처리
  await Promise.all([
    db.insert(hits)
      .values({ siteId: entry.siteId, date: entry.date, count: 1 })
      .onConflictDoUpdate({ target: [hits.siteId, hits.date], set: { count: sql`${hits.count} + 1` } }),

    db.update(sites)
      .set({ totalHits: sql`${sites.totalHits} + 1` })
      .where(eq(sites.id, entry.siteId)),

    db.insert(dailyGeoStats)
      .values({ siteId: entry.siteId, date: entry.date, country: entry.country ?? "", city: entry.city ?? "", count: 1 })
      .onConflictDoUpdate({
        target: [dailyGeoStats.siteId, dailyGeoStats.date, dailyGeoStats.country, dailyGeoStats.city],
        set: { count: sql`${dailyGeoStats.count} + 1` },
      }),

    db.insert(dailyDeviceStats)
      .values({ siteId: entry.siteId, date: entry.date, device: entry.device, browser: entry.browser, os: entry.os, count: 1 })
      .onConflictDoUpdate({
        target: [dailyDeviceStats.siteId, dailyDeviceStats.date, dailyDeviceStats.device, dailyDeviceStats.browser, dailyDeviceStats.os],
        set: { count: sql`${dailyDeviceStats.count} + 1` },
      }),

    db.insert(dailyHourStats)
      .values({ siteId: entry.siteId, date: entry.date, hour: entry.hourKST, count: 1 })
      .onConflictDoUpdate({
        target: [dailyHourStats.siteId, dailyHourStats.date, dailyHourStats.hour],
        set: { count: sql`${dailyHourStats.count} + 1` },
      }),
  ]);

  return true;
}

export async function directGetCountSnapshot(siteId: number): Promise<CountSnapshot | null> {
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

  if (!siteRow) return null;

  return {
    total: siteRow.totalHits,
    today: Number(todayR.v),
    weekly: Number(weeklyR.v),
    monthly: Number(monthlyR.v),
    updatedAt: new Date().toISOString(),
  };
}
