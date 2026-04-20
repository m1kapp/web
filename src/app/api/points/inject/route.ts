import { db } from "@/lib/db";
import { points, pointLogs, sites, hits } from "@/lib/db/schema";
import { eq, sql, and, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { todayKST } from "@/lib/format";
import { recordMilestoneIfReached } from "@/lib/site-service";
import { handler, ok, unauthorized, badRequest, notFound } from "@m1kapp/kit/server";

export const GET = handler(async (req) => {
  const { userId } = await auth();
  if (!userId) unauthorized("로그인이 필요합니다");

  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) badRequest("slug가 필요합니다");

  const site = await db.query.sites.findFirst({ where: eq(sites.slug, slug!) });
  if (!site) return ok({ total: 0, logs: [] });

  const logs = await db.query.pointLogs.findMany({
    where: and(
      eq(pointLogs.userId, userId!),
      eq(pointLogs.type, "inject"),
      eq(pointLogs.targetSiteId, site.id)
    ),
    orderBy: desc(pointLogs.createdAt),
    limit: 20,
  });

  const total = logs.reduce((sum, l) => sum + Math.abs(l.amount), 0);

  return ok({
    total,
    logs: logs.map((l) => ({ amount: Math.abs(l.amount), createdAt: l.createdAt, memo: l.memo })),
  });
});

export const POST = handler(async (req) => {
  const { userId } = await auth();
  if (!userId) unauthorized("로그인이 필요합니다");

  const { slug, amount, comment } = (await req.json()) as {
    slug?: string;
    amount?: number;
    comment?: string;
  };

  if (!slug || !amount || amount < 1) badRequest("slug과 1 이상의 amount가 필요합니다");

  const roundedAmount = Math.floor(amount!);

  const wallet = await db.query.points.findFirst({
    where: eq(points.userId, userId!),
  });

  if (!wallet || wallet.balance < roundedAmount) badRequest("부스트가 부족해요");

  const site = await db.query.sites.findFirst({
    where: eq(sites.slug, slug!),
  });

  if (!site) notFound("사이트를 찾을 수 없습니다");

  const today = todayKST();

  await db.update(points).set({
    balance: sql`${points.balance} - ${roundedAmount}`,
  }).where(eq(points.userId, userId!));

  await Promise.all([
    db.insert(hits)
      .values({ siteId: site!.id, date: today, count: roundedAmount })
      .onConflictDoUpdate({
        target: [hits.siteId, hits.date],
        set: { count: sql`${hits.count} + ${roundedAmount}` },
      }),
    db.insert(pointLogs).values({
      userId: userId!,
      amount: -roundedAmount,
      type: "inject",
      targetSiteId: site!.id,
      memo: comment?.trim() || (site!.userId === userId ? "🚀 내 사이트에 부스트" : `🚀 ${site!.title || site!.slug}에 부스트`),
    }),
  ]);

  const [, updated] = await Promise.all([
    site!.reached1000At ? Promise.resolve() : (async () => {
      const [{ v }] = await db
        .select({ v: sql<number>`coalesce(sum(${hits.count}), 0)` })
        .from(hits)
        .where(eq(hits.siteId, site!.id));
      await recordMilestoneIfReached(site!, Number(v));
    })(),
    db.query.points.findFirst({ where: eq(points.userId, userId!) }),
  ]);

  return ok({
    ok: true,
    injected: roundedAmount,
    balance: updated?.balance ?? 0,
    targetSlug: slug,
  });
});
