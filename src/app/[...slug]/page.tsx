import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import { appHost } from "@/lib/utils";
import { db } from "@/lib/db";
import { sites, hits, hitLogs, dailyGeoStats, dailyDeviceStats, dailyHourStats, pointLogs } from "@/lib/db/schema";
import { eq, sql, and, gte, desc, ne } from "drizzle-orm";
import { DashboardView } from "@/components/dashboard-view";
import { UserProfileView } from "@/components/user-profile-view";
import { auth } from "@clerk/nextjs/server";
import { todayKST } from "@/lib/format";

interface Props {
  params: Promise<{ slug: string[] }>;
}

const getSiteData = cache(async function getSiteData(slug: string) {
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
    db.select({ total: sql<number>`coalesce(sum(abs(${pointLogs.amount})), 0)` }).from(pointLogs).where(and(eq(pointLogs.targetSiteId, siteId), eq(pointLogs.type, "inject"))),
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
    [boostResult],
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
    createdAt: site.createdAt?.toISOString() ?? null,
    color: site.color ?? null,
    ogTitle: site.ogTitle ?? null,
    ogDescription: site.ogDescription ?? null,
    ogImage: site.ogImage ?? null,
    faviconUrl: site.faviconUrl ?? null,
    badgeStyle: site.badgeStyle ?? null,
    badgeColor: site.badgeColor ?? null,
    userId: site.userId ?? null,
    todayCount: Number(todayResult.total),
    verified: site.verified,
    parentId: site.parentId ?? null,
    boosted: Number(boostResult.total),
    ownerHandle: site.ownerHandle ?? null,
    ownerName: site.ownerName ?? null,
    ownerImageUrl: site.ownerImageUrl ?? null,
  };
}

async function getUserSites(userId: string) {
  const todayStr = todayKST();
  return db
    .select({
      slug: sites.slug,
      title: sites.title,
      url: sites.url,
      color: sites.color,
      ogTitle: sites.ogTitle,
      ogDescription: sites.ogDescription,
      ogImage: sites.ogImage,
      faviconUrl: sites.faviconUrl,
      total: sql<number>`coalesce(sum(${hits.count}), 0)`,
      today: sql<number>`coalesce(sum(case when ${hits.date} = ${todayStr} then ${hits.count} else 0 end), 0)`,
    })
    .from(sites)
    .leftJoin(hits, eq(hits.siteId, sites.id))
    .where(and(eq(sites.userId, userId), eq(sites.verified, true)))
    .groupBy(sites.id)
    .orderBy(desc(sites.createdAt));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: slugParts } = await params;
  const slug = slugParts.join("/");

  const decodedSlug = decodeURIComponent(slug);
  if (decodedSlug.startsWith("@")) {
    const handle = decodedSlug.slice(1);
    return { title: `@${handle} — m1k` };
  }

  const data = await getSiteData(slug);
  if (!data) return {};

  const host = appHost();
  const pageUrl = `https://${host}/${slug}`;
  const ogImageUrl = `https://${host}/og?slug=${encodeURIComponent(slug)}`;

  const title = data.ogTitle || data.title || slug;
  const description =
    data.ogDescription ||
    `${title} · 방문자 ${data.total.toLocaleString("ko-KR")}명 · m1k.app에서 추적 중`;

  return {
    title: `${title} — m1k`,
    description,
    openGraph: {
      title: `${title} — m1k`,
      description,
      url: pageUrl,
      siteName: "m1k",
      locale: "ko_KR",
      type: "website",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — m1k`,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function DashboardPage({ params }: Props) {
  const { slug: slugParts } = await params;
  const slug = slugParts.join("/");

  const decodedSlug = decodeURIComponent(slug);
  // /@handle — 유저 프로필 페이지
  if (decodedSlug.startsWith("@")) {
    const handle = decodedSlug.slice(1);

    // Clerk 대신 DB에서 owner_handle로 조회
    const ownerSite = await db.query.sites.findFirst({
      where: eq(sites.ownerHandle, handle),
    });
    if (!ownerSite?.userId) notFound();

    const user = {
      id: ownerSite.userId,
      handle: ownerSite.ownerHandle ?? handle,
      name: ownerSite.ownerName ?? handle,
      imageUrl: ownerSite.ownerImageUrl ?? "",
    };

    const rawSites = await getUserSites(user.id);
    const userSites = rawSites.map((s) => ({
      ...s,
      total: Number(s.total),
      today: Number(s.today),
      owner: { name: user.name, imageUrl: user.imageUrl },
    }));

    // 유저 전체 사이트에 대한 응원 로그
    const siteIds = await db.select({ id: sites.id, slug: sites.slug, ogTitle: sites.ogTitle, ogDescription: sites.ogDescription, title: sites.title, faviconUrl: sites.faviconUrl, color: sites.color }).from(sites).where(eq(sites.userId, user.id));
    const ids = siteIds.map((s) => s.id);
    let totalBoost = 0;
    let boostLogs: { amount: number; createdAt: string | null; memo: string | null; userId: string; siteSlug: string; siteName: string; siteDescription: string | null; siteFavicon: string | null; siteColor: string | null }[] = [];

    if (ids.length > 0) {
      const siteMap = Object.fromEntries(siteIds.map((s) => [s.id, s]));
      const [boostResult] = await db
        .select({ total: sql<number>`coalesce(sum(abs(${pointLogs.amount})), 0)` })
        .from(pointLogs)
        .where(and(sql`${pointLogs.targetSiteId} in (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`, eq(pointLogs.type, "inject")));
      totalBoost = Number(boostResult.total);

      const rawLogs = await db.query.pointLogs.findMany({
        where: and(sql`${pointLogs.targetSiteId} in (${sql.join(ids.map(id => sql`${id}`), sql`, `)})`, eq(pointLogs.type, "inject")),
        orderBy: desc(pointLogs.createdAt),
        limit: 100,
      });

      // Clerk에서 유저 정보 가져오기
      const uniqueUserIds = [...new Set(rawLogs.map((l) => l.userId))];
      let userMap: Record<string, { name: string; imageUrl: string | null }> = {};
      if (uniqueUserIds.length > 0) {
        const { clerkClient } = await import("@clerk/nextjs/server");
        const clerk = await clerkClient();
        const users = await clerk.users.getUserList({ userId: uniqueUserIds, limit: Math.min(uniqueUserIds.length, 100) });
        userMap = Object.fromEntries(
          users.data.map((u) => [u.id, { name: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "익명", imageUrl: u.imageUrl }])
        );
      }

      boostLogs = rawLogs.map((l) => {
        const s = siteMap[l.targetSiteId!];
        const u = userMap[l.userId];
        return {
          amount: Math.abs(l.amount),
          createdAt: l.createdAt?.toISOString() ?? null,
          memo: l.memo && !l.memo.startsWith("🚀") ? l.memo : null,
          userId: l.userId,
          userName: u?.name ?? "익명",
          userImageUrl: u?.imageUrl ?? null,
          siteSlug: s?.slug ?? "",
          siteName: s?.ogTitle || s?.title || s?.slug || "",
          siteDescription: s?.ogDescription ?? null,
          siteFavicon: s?.faviconUrl ?? null,
          siteColor: s?.color ?? null,
        };
      });
    }

    const stats = {
      apps: userSites.length,
      totalVisitors: userSites.reduce((sum, s) => sum + s.total, 0),
      todayVisitors: userSites.reduce((sum, s) => sum + s.today, 0),
      totalBoost,
    };

    return <UserProfileView user={user} sites={userSites} stats={stats} boostLogs={boostLogs as any} />;
  }

  // 사이트 상세 페이지
  const data = await getSiteData(slug);
  if (!data) notFound();

  const { userId } = await auth();
  const isOwner = !!userId && data.userId === userId;

  const owner = data.ownerHandle
    ? { handle: data.ownerHandle, name: data.ownerName ?? data.ownerHandle, imageUrl: data.ownerImageUrl ?? "" }
    : null;

  return (
    <DashboardView
      data={data}
      host={appHost()}
      isOwner={isOwner}
      isSignedIn={!!userId}
      owner={owner}
    />
  );
}
