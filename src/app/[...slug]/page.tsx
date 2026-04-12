import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { sites, hits, hitLogs, pointLogs } from "@/lib/db/schema";
import { eq, sql, and, gte, desc } from "drizzle-orm";
import { DashboardView } from "@/components/dashboard-view";
import { auth } from "@clerk/nextjs/server";

interface Props {
  params: Promise<{ slug: string[] }>;
}

async function getSiteData(slug: string) {
  const site = await db.query.sites.findFirst({
    where: eq(sites.slug, slug),
  });
  if (!site) return null;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const todayStr = new Date().toISOString().split("T")[0];

  const [
    [totalResult],
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
  ] = await Promise.all([
    db.select({ total: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(eq(hits.siteId, site.id)),
    db.select({ total: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, site.id), gte(hits.date, weekAgo.toISOString().split("T")[0]))),
    db.select({ total: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, site.id), eq(hits.date, todayStr))),
    db.select({ total: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, site.id), gte(hits.date, monthAgo.toISOString().split("T")[0]))),
    db.select({ date: hits.date, count: hits.count }).from(hits).where(eq(hits.siteId, site.id)).orderBy(hits.date),
    db.select({ country: hitLogs.country, count: sql<number>`count(*)` }).from(hitLogs).where(eq(hitLogs.siteId, site.id)).groupBy(hitLogs.country).orderBy(desc(sql`count(*)`)).limit(5),
    db.select({ device: hitLogs.device, count: sql<number>`count(*)` }).from(hitLogs).where(eq(hitLogs.siteId, site.id)).groupBy(hitLogs.device).orderBy(desc(sql`count(*)`)),
    db.select({ referer: hitLogs.referer, count: sql<number>`count(*)` }).from(hitLogs).where(and(eq(hitLogs.siteId, site.id), sql`${hitLogs.referer} is not null`)).groupBy(hitLogs.referer).orderBy(desc(sql`count(*)`)).limit(5),
    db.select({ browser: hitLogs.browser, count: sql<number>`count(*)` }).from(hitLogs).where(eq(hitLogs.siteId, site.id)).groupBy(hitLogs.browser).orderBy(desc(sql`count(*)`)),
    db.select({ os: hitLogs.os, count: sql<number>`count(*)` }).from(hitLogs).where(eq(hitLogs.siteId, site.id)).groupBy(hitLogs.os).orderBy(desc(sql`count(*)`)),
    db.select({ city: hitLogs.city, count: sql<number>`count(*)` }).from(hitLogs).where(and(eq(hitLogs.siteId, site.id), sql`${hitLogs.city} is not null`)).groupBy(hitLogs.city).orderBy(desc(sql`count(*)`)).limit(5),
    db.select({ hour: sql<number>`extract(hour from ${hitLogs.createdAt})::int`, count: sql<number>`count(*)` }).from(hitLogs).where(eq(hitLogs.siteId, site.id)).groupBy(sql`extract(hour from ${hitLogs.createdAt})`).orderBy(desc(sql`count(*)`)).limit(6),
    db.select({ total: sql<number>`coalesce(sum(abs(${pointLogs.amount})), 0)` }).from(pointLogs).where(and(eq(pointLogs.targetSiteId, site.id), eq(pointLogs.type, "inject"))),
  ]);

  return {
    slug: site.slug,
    title: site.title,
    url: site.url,
    total: Number(totalResult.total),
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
    badgeStyle: site.badgeStyle ?? null,
    badgeLabel: site.badgeLabel ?? null,
    badgeEmoji: site.badgeEmoji ?? null,
    ogTitle: site.ogTitle ?? null,
    ogDescription: site.ogDescription ?? null,
    ogImage: site.ogImage ?? null,
    userId: site.userId ?? null,
    todayCount: Number(todayResult.total),
    verified: site.verified,
    parentId: site.parentId ?? null,
    boosted: Number(boostResult.total),
  };
}

export default async function DashboardPage({ params }: Props) {
  const { slug: slugParts } = await params;
  const slug = slugParts.join("/");
  const data = await getSiteData(slug);
  if (!data) notFound();

  const { userId } = await auth();
  const host = process.env.NEXT_PUBLIC_HOST || "m1k.app";
  const isOwner = !!userId && data.userId === userId;

  return <DashboardView data={data} host={host} isOwner={isOwner} />;
}
