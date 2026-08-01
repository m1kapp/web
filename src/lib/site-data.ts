import { cache } from "react";
import { db } from "@/lib/db";
import { sites, hits, hitLogs, dailyGeoStats, dailyDeviceStats, dailyHourStats } from "@/lib/db/schema";
import { eq, sql, and, gte, desc, ne } from "drizzle-orm";
import { todayKST } from "@/lib/format";
import { getCountSnapshot, getBufferedCount, getBufferedTotal } from "@/lib/hit-buffer";

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

/** 대시보드 통계 쿼리 일괄 실행 (total은 sites.totalHits 사용 — SUM 쿼리 제거)
 *
 * Neon 은 flush 크론이 채운다. 그 전 히트는 Redis 버퍼에만 있으므로 여기서 같이
 * 읽어 합친다 — 안 합치면 방문이 들어와도 크론이 돌기 전까지 "0명 방문 · 뱃지를
 * 심으면 추적이 시작돼요"가 뜬다. 배지(app/badge)와 /api/sites/[slug]?view=public
 * 은 이미 합쳐서 내보내고 있어서, 배지엔 1이 뜨는데 대시보드는 0인 상태였다. */
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
    getCountSnapshot(siteId),
    getBufferedCount(siteId, todayStr),
    getBufferedTotal(siteId),
  ]);
}

/** 아직 flush 안 된 오늘치를 일별 계열에도 반영한다 — 오늘 칸만 비면 그래프가 거짓말한다 */
function mergeToday(daily: { date: string; count: number }[], todayStr: string, add: number) {
  if (add <= 0) return daily;
  const i = daily.findIndex((d) => d.date === todayStr);
  if (i === -1) return [...daily, { date: todayStr, count: add }];
  return daily.map((d, n) => (n === i ? { ...d, count: Number(d.count) + add } : d));
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
    snapshot,
    bufferedToday,
    bufferedTotal,
  ] = queryResult;

  // 배지(app/badge/[...slug])의 resolveCounts 와 같은 병합이다. flush 크론이
  // Neon 에 쓰면서 버퍼 키를 지우므로 이중계산은 없다.
  const todayStr = todayKST();
  const base = snapshot ?? { total: site.totalHits, today: 0, weekly: 0, monthly: 0 };

  return {
    slug: site.slug,
    title: site.title,
    url: site.url,
    total: base.total + bufferedTotal,
    weekly: Number(weeklyResult.total) + bufferedToday,
    monthly: Number(monthlyResult.total) + bufferedToday,
    daily: mergeToday(daily, todayStr, bufferedToday),
    countries,
    devices,
    referers,
    browsers,
    os,
    cities,
    hourly,
    ...siteMetaFields(site),
    todayCount: Number(todayResult.total) + bufferedToday,
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
