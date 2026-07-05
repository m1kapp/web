import { db } from "@/lib/db";
import { sites, hits, hitLogs, dailyGeoStats, dailyDeviceStats, pointLogs } from "@/lib/db/schema";
import { eq, sql, and, gte, desc, ne } from "drizzle-orm";
import { todayKST } from "@/lib/format";
import { handler, ok, notFound } from "@m1kapp/kit/server";
import { getCountSnapshot, getBufferedCount, getBufferedTotal } from "@/lib/hit-buffer";

export const GET = handler(async (req: Request, ctx: { params: Promise<{ slug: string[] }> }) => {
  const { slug: slugParts } = await ctx.params;
  const slug = slugParts.join("/");

  const site = await db.query.sites.findFirst({
    where: eq(sites.slug, slug),
  });

  if (!site) notFound("프로젝트를 찾을 수 없습니다");

  const now = new Date();
  const todayStr = todayKST(now);

  // 경량 공개 카운트 — kit PoweredByKit 푸터용. today/total만 반환하고 CORS 허용.
  // (풀 통계는 same-origin 유지 → 국가·기기·리퍼러 등은 교차출처로 노출하지 않음)
  if (new URL(req.url).searchParams.get("view") === "count") {
    // 실시간: DB 스냅샷 + Redis 버퍼 증분 합산 (flush 주기와 무관하게 today/total 최신)
    const [snapshot, bufferedToday, bufferedTotal] = await Promise.all([
      getCountSnapshot(site!.id),
      getBufferedCount(site!.id, todayStr),
      getBufferedTotal(site!.id),
    ]);
    const base = snapshot ?? { total: site!.totalHits, today: 0 };
    const res = ok({ slug: site!.slug, today: base.today + bufferedToday, total: base.total + bufferedTotal });
    res.headers.set("Access-Control-Allow-Origin", "*");
    return res;
  }

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [[todayResult], [weeklyResult], [monthlyResult], [boostedResult], daily, countries, devices, referers] = await Promise.all([
    db.select({ total: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, site!.id), eq(hits.date, todayStr))),
    db.select({ total: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, site!.id), gte(hits.date, todayKST(weekAgo)))),
    db.select({ total: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, site!.id), gte(hits.date, todayKST(monthAgo)))),
    db.select({ total: sql<number>`coalesce(sum(abs(${pointLogs.amount})), 0)` }).from(pointLogs).where(and(eq(pointLogs.targetSiteId, site!.id), eq(pointLogs.type, "inject"))),
    db.select({ date: hits.date, count: hits.count }).from(hits).where(and(eq(hits.siteId, site!.id), gte(hits.date, todayKST(ninetyDaysAgo)))).orderBy(hits.date),
    // 사전집계 테이블 사용
    db.select({ country: dailyGeoStats.country, count: sql<number>`sum(${dailyGeoStats.count})` }).from(dailyGeoStats).where(and(eq(dailyGeoStats.siteId, site!.id), ne(dailyGeoStats.country, ""))).groupBy(dailyGeoStats.country).orderBy(desc(sql`sum(${dailyGeoStats.count})`)).limit(10),
    db.select({ device: dailyDeviceStats.device, count: sql<number>`sum(${dailyDeviceStats.count})` }).from(dailyDeviceStats).where(eq(dailyDeviceStats.siteId, site!.id)).groupBy(dailyDeviceStats.device).orderBy(desc(sql`sum(${dailyDeviceStats.count})`)).limit(5),
    db.select({ referer: sql<string>`regexp_replace(${hitLogs.referer}, '^https?://[^/]+', '')`, count: sql<number>`count(*)` }).from(hitLogs).where(and(eq(hitLogs.siteId, site!.id), sql`${hitLogs.referer} is not null`)).groupBy(sql`regexp_replace(${hitLogs.referer}, '^https?://[^/]+', '')`).orderBy(desc(sql`count(*)`)).limit(10),
  ]);

  const total = site!.totalHits;

  return ok({
    slug: site!.slug,
    title: site!.title,
    url: site!.url,
    total,
    weekly: Number(weeklyResult.total),
    monthly: Number(monthlyResult.total),
    todayCount: Number(todayResult.total),
    boosted: Number(boostedResult.total),
    progress: Math.min(total / 1000, 1),
    daily,
    countries,
    devices,
    referers,
    createdAt: site!.createdAt,
  });
});
