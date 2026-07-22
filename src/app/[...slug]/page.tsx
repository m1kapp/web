import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { appHost } from "@/lib/utils";
import { db } from "@/lib/db";
import { getSiteData } from "@/lib/site-data";
import { sites, hits } from "@/lib/db/schema";
import { siteCardColumns, totalHitsSql } from "@/lib/site-query";
import { eq, sql, and, desc } from "drizzle-orm";
import { DashboardView } from "@/components/dashboard-view";
import { UserProfileView } from "@/components/user-profile-view";
import { auth } from "@clerk/nextjs/server";
import { todayKST } from "@/lib/format";

interface Props {
  params: Promise<{ slug: string[] }>;
}


async function getUserSites(userId: string) {
  const todayStr = todayKST();
  return db
    .select({
      ...siteCardColumns,
      ogDescription: sites.ogDescription,
      ogImage: sites.ogImage,
      total: totalHitsSql,
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

    const stats = {
      apps: userSites.length,
      totalVisitors: userSites.reduce((sum, s) => sum + s.total, 0),
      todayVisitors: userSites.reduce((sum, s) => sum + s.today, 0),
    };

    return <UserProfileView user={user} sites={userSites} stats={stats} />;
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
      owner={owner}
    />
  );
}
