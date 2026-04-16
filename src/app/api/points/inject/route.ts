import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { points, pointLogs, sites, hits } from "@/lib/db/schema";
import { eq, sql, and, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { todayKST } from "@/lib/format";
import { recordMilestoneIfReached } from "@/lib/site-service";

// 내가 이 사이트에 보낸 부스트 이력 조회
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });

  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug가 필요합니다" }, { status: 400 });

  const site = await db.query.sites.findFirst({ where: eq(sites.slug, slug) });
  if (!site) return NextResponse.json({ total: 0, logs: [] });

  const logs = await db.query.pointLogs.findMany({
    where: and(
      eq(pointLogs.userId, userId),
      eq(pointLogs.type, "inject"),
      eq(pointLogs.targetSiteId, site.id)
    ),
    orderBy: desc(pointLogs.createdAt),
    limit: 20,
  });

  const total = logs.reduce((sum, l) => sum + Math.abs(l.amount), 0);

  return NextResponse.json({
    total,
    logs: logs.map((l) => ({ amount: Math.abs(l.amount), createdAt: l.createdAt })),
  });
}

// 부스트 보내기 (내 사이트든 남의 사이트든)
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { slug, amount } = (await request.json()) as {
    slug?: string;
    amount?: number;
  };

  if (!slug || !amount || amount < 1) {
    return NextResponse.json({ error: "slug과 1 이상의 amount가 필요합니다" }, { status: 400 });
  }

  const roundedAmount = Math.floor(amount);

  const wallet = await db.query.points.findFirst({
    where: eq(points.userId, userId),
  });

  if (!wallet || wallet.balance < roundedAmount) {
    return NextResponse.json({ error: "부스트가 부족해요" }, { status: 400 });
  }

  const site = await db.query.sites.findFirst({
    where: eq(sites.slug, slug),
  });

  if (!site) {
    return NextResponse.json({ error: "사이트를 찾을 수 없습니다" }, { status: 404 });
  }

  const today = todayKST();

  await db.update(points).set({
    balance: sql`${points.balance} - ${roundedAmount}`,
  }).where(eq(points.userId, userId));

  await db
    .insert(hits)
    .values({ siteId: site.id, date: today, count: roundedAmount })
    .onConflictDoUpdate({
      target: [hits.siteId, hits.date],
      set: { count: sql`${hits.count} + ${roundedAmount}` },
    });

  await db.insert(pointLogs).values({
    userId,
    amount: -roundedAmount,
    type: "inject",
    targetSiteId: site.id,
    memo: site.userId === userId ? "🚀 내 사이트에 부스트" : `🚀 ${site.title || site.slug}에 부스트`,
  });

  if (!site.reached1000At) {
    const [{ v }] = await db
      .select({ v: sql<number>`coalesce(sum(${hits.count}), 0)` })
      .from(hits)
      .where(eq(hits.siteId, site.id));
    await recordMilestoneIfReached(site, Number(v));
  }

  const updated = await db.query.points.findFirst({
    where: eq(points.userId, userId),
  });

  return NextResponse.json({
    ok: true,
    injected: roundedAmount,
    balance: updated?.balance ?? 0,
    targetSlug: slug,
  });
}
