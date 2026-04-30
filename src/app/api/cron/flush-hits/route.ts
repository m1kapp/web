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

  // ── 2. 버퍼 로그 drain ────────────────────────────────────────────
  const entries = await drainLogs(1000);
  if (entries.length === 0 && verifyItems.length === 0) {
    return Response.json({ flushed: 0, verified: 0 });
  }

  if (entries.length > 0) {
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
    const hitAgg = new Map<string, { siteId: number; date: string; count: number }>();
    for (const e of entries) {
      const key = `${e.siteId}:${e.date}`;
      const cur = hitAgg.get(key);
      if (cur) cur.count++;
      else hitAgg.set(key, { siteId: e.siteId, date: e.date, count: 1 });
    }
    for (const h of hitAgg.values()) {
      await db.insert(hits).values({ siteId: h.siteId, date: h.date, count: h.count })
        .onConflictDoUpdate({ target: [hits.siteId, hits.date], set: { count: sql`${hits.count} + ${h.count}` } });
    }

    // sites.totalHits
    const totalAgg = new Map<number, number>();
    for (const e of entries) {
      totalAgg.set(e.siteId, (totalAgg.get(e.siteId) ?? 0) + 1);
    }
    for (const [siteId, count] of totalAgg) {
      await db.update(sites).set({ totalHits: sql`${sites.totalHits} + ${count}` }).where(eq(sites.id, siteId));
    }

    // dailyGeoStats
    const geoAgg = new Map<string, { siteId: number; date: string; country: string; city: string; count: number }>();
    for (const e of entries) {
      const key = `${e.siteId}:${e.date}:${e.country ?? ""}:${e.city ?? ""}`;
      const cur = geoAgg.get(key);
      if (cur) cur.count++;
      else geoAgg.set(key, { siteId: e.siteId, date: e.date, country: e.country ?? "", city: e.city ?? "", count: 1 });
    }
    for (const g of geoAgg.values()) {
      await db.insert(dailyGeoStats).values(g)
        .onConflictDoUpdate({
          target: [dailyGeoStats.siteId, dailyGeoStats.date, dailyGeoStats.country, dailyGeoStats.city],
          set: { count: sql`${dailyGeoStats.count} + ${g.count}` },
        });
    }

    // dailyDeviceStats
    const devAgg = new Map<string, { siteId: number; date: string; device: string; browser: string; os: string; count: number }>();
    for (const e of entries) {
      const key = `${e.siteId}:${e.date}:${e.device}:${e.browser}:${e.os}`;
      const cur = devAgg.get(key);
      if (cur) cur.count++;
      else devAgg.set(key, { siteId: e.siteId, date: e.date, device: e.device, browser: e.browser, os: e.os, count: 1 });
    }
    for (const d of devAgg.values()) {
      await db.insert(dailyDeviceStats).values(d)
        .onConflictDoUpdate({
          target: [dailyDeviceStats.siteId, dailyDeviceStats.date, dailyDeviceStats.device, dailyDeviceStats.browser, dailyDeviceStats.os],
          set: { count: sql`${dailyDeviceStats.count} + ${d.count}` },
        });
    }

    // dailyHourStats
    const hourAgg = new Map<string, { siteId: number; date: string; hour: number; count: number }>();
    for (const e of entries) {
      const key = `${e.siteId}:${e.date}:${e.hourKST}`;
      const cur = hourAgg.get(key);
      if (cur) cur.count++;
      else hourAgg.set(key, { siteId: e.siteId, date: e.date, hour: e.hourKST, count: 1 });
    }
    for (const h of hourAgg.values()) {
      await db.insert(dailyHourStats).values(h)
        .onConflictDoUpdate({
          target: [dailyHourStats.siteId, dailyHourStats.date, dailyHourStats.hour],
          set: { count: sql`${dailyHourStats.count} + ${h.count}` },
        });
    }

    // Redis 카운트 키 정리
    await clearFlushedKeys(entries);
  }

  // ── 3. 카운트 스냅샷 갱신 + milestone 체크 ────────────────────────
  const affectedSiteIds = [...new Set(entries.map((e) => e.siteId))];
  const now = new Date();
  const todayStr = todayKST(now);
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30);

  for (const siteId of affectedSiteIds) {
    const [siteRow, [todayR], [weeklyR], [monthlyR]] = await Promise.all([
      db.query.sites.findFirst({ where: eq(sites.id, siteId) }),
      db.select({ v: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, siteId), eq(hits.date, todayStr))),
      db.select({ v: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, siteId), gte(hits.date, todayKST(weekAgo)))),
      db.select({ v: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, siteId), gte(hits.date, todayKST(monthAgo)))),
    ]);

    if (!siteRow) continue;

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

  return Response.json({ flushed: entries.length, verified: verifyItems.length, snapshots: affectedSiteIds.length });
}
