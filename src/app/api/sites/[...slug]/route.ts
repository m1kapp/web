import { db } from "@/lib/db";
import { sites, hits, hitLogs, pointLogs } from "@/lib/db/schema";
import { eq, sql, and, gte, desc } from "drizzle-orm";
import { todayKST } from "@/lib/format";
import { handler, ok, notFound } from "@m1kapp/kit/server";

export const GET = handler(async (_req: Request, ctx: { params: Promise<{ slug: string[] }> }) => {
  const { slug: slugParts } = await ctx.params;
  const slug = slugParts.join("/");

  const site = await db.query.sites.findFirst({
    where: eq(sites.slug, slug),
  });

  if (!site) notFound("프로젝트를 찾을 수 없습니다");

  const now = new Date();
  const todayStr = todayKST(now);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const [[totalResult], [todayResult], [weeklyResult], [monthlyResult], [boostedResult], daily] = await Promise.all([
    db.select({ total: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(eq(hits.siteId, site!.id)),
    db.select({ total: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, site!.id), eq(hits.date, todayStr))),
    db.select({ total: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, site!.id), gte(hits.date, todayKST(weekAgo)))),
    db.select({ total: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, site!.id), gte(hits.date, todayKST(monthAgo)))),
    db.select({ total: sql<number>`coalesce(sum(abs(${pointLogs.amount})), 0)` }).from(pointLogs).where(and(eq(pointLogs.targetSiteId, site!.id), eq(pointLogs.type, "inject"))),
    db.select({ date: hits.date, count: hits.count }).from(hits).where(and(eq(hits.siteId, site!.id), gte(hits.date, todayKST(ninetyDaysAgo)))).orderBy(hits.date),
  ]);

  const countries = await db
    .select({
      country: hitLogs.country,
      count: sql<number>`count(*)`,
    })
    .from(hitLogs)
    .where(eq(hitLogs.siteId, site!.id))
    .groupBy(hitLogs.country)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  const devices = await db
    .select({
      device: hitLogs.device,
      count: sql<number>`count(*)`,
    })
    .from(hitLogs)
    .where(eq(hitLogs.siteId, site!.id))
    .groupBy(hitLogs.device)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  const referers = await db
    .select({
      referer: sql<string>`regexp_replace(${hitLogs.referer}, '^https?://[^/]+', '')`,
      count: sql<number>`count(*)`,
    })
    .from(hitLogs)
    .where(and(eq(hitLogs.siteId, site!.id), sql`${hitLogs.referer} is not null`))
    .groupBy(sql`regexp_replace(${hitLogs.referer}, '^https?://[^/]+', '')`)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  const total = Number(totalResult.total);

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
