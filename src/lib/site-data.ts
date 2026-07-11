import { cache } from "react";
import { db } from "@/lib/db";
import { sites, hits, hitLogs, dailyGeoStats, dailyDeviceStats, dailyHourStats } from "@/lib/db/schema";
import { eq, sql, and, gte, desc, ne } from "drizzle-orm";
import { todayKST } from "@/lib/format";

export const getSiteData = cache(async function getSiteData(slug: string) {
  let site;
  try {
    site = await db.query.sites.findFirst({ where: eq(sites.slug, slug) });
  } catch (err) {
    console.error("[getSiteData] DB error:", (err as Error).message?.slice(0, 80));
    return null;
  }
  if (!site) return null;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const todayStr = todayKST();

  let queryResult;
  try {
    queryResult = await fetchSiteStats(site.id, todayStr, weekAgo, monthAgo);
  } catch (err) {
    console.error("[getSiteData] stats query error:", (err as Error).message?.slice(0, 80));
    return null;
  }

  return toSiteData(site, queryResult);
});

/** 대시보드 통계 쿼리 일괄 실행 (total은 sites.totalHits 사용 — SUM 쿼리 제거) */
function fetchSiteStats(siteId: number, todayStr: string, weekAgo: Date, monthAgo: Date) {
  return Promise.all([
    db.select({ total: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, siteId), gte(hits.date, todayKST(weekAgo)))),
    db.select({ total: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, siteId), eq(hits.date, todayStr))),
    db.select({ total: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, siteId), gte(hits.date, todayKST(monthAgo)))),
    db.select({ date: hits.date, count: hits.count }).from(hits).where(eq(hits.siteId, siteId)).orderBy(hits.date),
    // 사전집계 테이블 사용 (hitLogs 전체 스캔 제거)
    db.select({ country: dailyGeoStats.country, count: sql<number>`sum(${dailyGeoStats.count})` }).from(dailyGeoStats).where(and(eq(dailyGeoStats.siteId, siteId), ne(dailyGeoStats.country, ""))).groupBy(dailyGeoStats.country).orderBy(desc(sql`sum(${dailyGeoStats.count})`)).limit(5),
    db.select({ device: dailyDeviceStats.device, count: sql<number>`sum(${dailyDeviceStats.count})` }).from(dailyDeviceStats).where(eq(dailyDeviceStats.siteId, siteId)).groupBy(dailyDeviceStats.device).orderBy(desc(sql`sum(${dailyDeviceStats.count})`)).limit(5),
    db.select({ referer: sql<string>`regexp_replace(${hitLogs.referer}, '^https?://[^/]+', '')`, count: sql<number>`count(*)` }).from(hitLogs).where(and(eq(hitLogs.siteId, siteId), sql`${hitLogs.referer} is not null`)).groupBy(sql`regexp_replace(${hitLogs.referer}, '^https?://[^/]+', '')`).orderBy(desc(sql`count(*)`)).limit(5),
    db.select({ browser: dailyDeviceStats.browser, count: sql<number>`sum(${dailyDeviceStats.count})` }).from(dailyDeviceStats).where(eq(dailyDeviceStats.siteId, siteId)).groupBy(dailyDeviceStats.browser).orderBy(desc(sql`sum(${dailyDeviceStats.count})`)).limit(5),
    db.select({ os: dailyDeviceStats.os, count: sql<number>`sum(${dailyDeviceStats.count})` }).from(dailyDeviceStats).where(eq(dailyDeviceStats.siteId, siteId)).groupBy(dailyDeviceStats.os).orderBy(desc(sql`sum(${dailyDeviceStats.count})`)).limit(5),
    db.select({ city: dailyGeoStats.city, count: sql<number>`sum(${dailyGeoStats.count})` }).from(dailyGeoStats).where(and(eq(dailyGeoStats.siteId, siteId), ne(dailyGeoStats.city, ""))).groupBy(dailyGeoStats.city).orderBy(desc(sql`sum(${dailyGeoStats.count})`)),
    db.select({ hour: dailyHourStats.hour, count: sql<number>`sum(${dailyHourStats.count})` }).from(dailyHourStats).where(eq(dailyHourStats.siteId, siteId)).groupBy(dailyHourStats.hour).orderBy(dailyHourStats.hour),
  ]);
}

type SiteRow = NonNullable<Awaited<ReturnType<typeof db.query.sites.findFirst>>>;

/** 통계 쿼리 결과 + site 행을 DashboardView가 먹는 SiteData 모양으로 */
function toSiteData(site: SiteRow, queryResult: Awaited<ReturnType<typeof fetchSiteStats>>) {
  const [
    [weeklyResult],
    [todayResult],
    [monthlyResult],
    daily,
    countries,
    devices,
    referers,
    browsers,
    os,
    cities,
    hourly,
  ] = queryResult;

  return {
    slug: site.slug,
    title: site.title,
    url: site.url,
    total: site.totalHits,
    weekly: Number(weeklyResult.total),
    monthly: Number(monthlyResult.total),
    daily,
    countries,
    devices,
    referers,
    browsers,
    os,
    cities,
    hourly,
    ...siteMetaFields(site),
    todayCount: Number(todayResult.total),
    verified: site.verified,
  };
}

/** site 행의 nullable 메타 필드를 null 기본값으로 정규화 */
function siteMetaFields(site: SiteRow) {
  return {
    createdAt: site.createdAt?.toISOString() ?? null,
    color: site.color ?? null,
    ogTitle: site.ogTitle ?? null,
    ogDescription: site.ogDescription ?? null,
    ogImage: site.ogImage ?? null,
    faviconUrl: site.faviconUrl ?? null,
    badgeStyle: site.badgeStyle ?? null,
    badgeColor: site.badgeColor ?? null,
    userId: site.userId ?? null,
    parentId: site.parentId ?? null,
    ownerHandle: site.ownerHandle ?? null,
    ownerName: site.ownerName ?? null,
    ownerImageUrl: site.ownerImageUrl ?? null,
  };
}
