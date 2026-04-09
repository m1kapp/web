import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites, hits, hitLogs } from "@/lib/db/schema";
import { eq, sql, and, gte, desc } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug: slugParts } = await params;
  const slug = slugParts.join("/");

  const site = await db.query.sites.findFirst({
    where: eq(sites.slug, slug),
  });

  if (!site) {
    return NextResponse.json({ error: "프로젝트를 찾을 수 없습니다" }, { status: 404 });
  }

  // 총 방문수 + 기간별
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [[totalResult], [todayResult], [weeklyResult], [monthlyResult]] = await Promise.all([
    db.select({ total: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(eq(hits.siteId, site.id)),
    db.select({ total: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, site.id), eq(hits.date, todayStr))),
    db.select({ total: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, site.id), gte(hits.date, weekAgo.toISOString().split("T")[0]))),
    db.select({ total: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, site.id), gte(hits.date, monthAgo.toISOString().split("T")[0]))),
  ]);

  // 최근 90일 일별 데이터 (잔디용)
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const daily = await db
    .select({ date: hits.date, count: hits.count })
    .from(hits)
    .where(
      and(
        eq(hits.siteId, site.id),
        gte(hits.date, ninetyDaysAgo.toISOString().split("T")[0])
      )
    )
    .orderBy(hits.date);

  // 국가별 통계
  const countries = await db
    .select({
      country: hitLogs.country,
      count: sql<number>`count(*)`,
    })
    .from(hitLogs)
    .where(eq(hitLogs.siteId, site.id))
    .groupBy(hitLogs.country)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  // 디바이스별 통계
  const devices = await db
    .select({
      device: hitLogs.device,
      count: sql<number>`count(*)`,
    })
    .from(hitLogs)
    .where(eq(hitLogs.siteId, site.id))
    .groupBy(hitLogs.device)
    .orderBy(desc(sql`count(*)`));

  // 리퍼러 통계 (도메인만)
  const referers = await db
    .select({
      referer: hitLogs.referer,
      count: sql<number>`count(*)`,
    })
    .from(hitLogs)
    .where(and(eq(hitLogs.siteId, site.id), sql`${hitLogs.referer} is not null`))
    .groupBy(hitLogs.referer)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  const total = Number(totalResult.total);

  return NextResponse.json({
    slug: site.slug,
    title: site.title,
    url: site.url,
    total,
    weekly: Number(weeklyResult.total),
    monthly: Number(monthlyResult.total),
    todayCount: Number(todayResult.total),
    progress: Math.min(total / 1000, 1),
    daily,
    countries,
    devices,
    referers,
    createdAt: site.createdAt,
  });
}
