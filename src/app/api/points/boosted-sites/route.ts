import { db } from "@/lib/db";
import { pointLogs, sites } from "@/lib/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { handler, ok, unauthorized } from "@m1kapp/kit/server";

// 내가 부스트한 남의 사이트 목록
export const GET = handler(async () => {
  const { userId } = await auth();
  if (!userId) unauthorized("로그인이 필요합니다");

  const rows = await db
    .select({
      slug: sites.slug,
      title: sites.title,
      url: sites.url,
      color: sites.color,
      ogTitle: sites.ogTitle,
      ogDescription: sites.ogDescription,
      ogImage: sites.ogImage,
      ownerUserId: sites.userId,
      totalBoosted: sql<number>`sum(abs(${pointLogs.amount}))`,
    })
    .from(pointLogs)
    .innerJoin(sites, eq(pointLogs.targetSiteId, sites.id))
    .where(
      and(
        eq(pointLogs.userId, userId!),
        eq(pointLogs.type, "inject"),
        ne(sites.userId, userId!)
      )
    )
    .groupBy(
      sites.id,
      sites.slug,
      sites.title,
      sites.url,
      sites.color,
      sites.ogTitle,
      sites.ogDescription,
      sites.ogImage,
      sites.userId
    )
    .orderBy(sql`sum(abs(${pointLogs.amount})) desc`);

  return ok({ sites: rows });
});
