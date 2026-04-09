import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites, hits } from "@/lib/db/schema";
import { sql, desc, asc, ilike, or, eq, and } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const sort = url.searchParams.get("sort") || "recent";

  const totalSubquery = sql<number>`coalesce((select sum(${hits.count}) from ${hits} where ${hits.siteId} = ${sites.id}), 0)`;

  const whereCondition = q
    ? and(
        eq(sites.verified, true),
        or(
          ilike(sites.title, `%${q}%`),
          ilike(sites.ogTitle, `%${q}%`),
          ilike(sites.ogDescription, `%${q}%`)
        )
      )
    : eq(sites.verified, true);

  let query = db
    .select({
      slug: sites.slug,
      title: sites.title,
      url: sites.url,
      ogTitle: sites.ogTitle,
      ogDescription: sites.ogDescription,
      ogImage: sites.ogImage,
      color: sites.color,
      userId: sites.userId,
      total: totalSubquery,
      createdAt: sites.createdAt,
    })
    .from(sites)
    .where(whereCondition);

  if (sort === "popular") {
    query = query.orderBy(desc(totalSubquery)) as typeof query;
  } else if (sort === "name") {
    query = query.orderBy(asc(sites.title)) as typeof query;
  } else {
    query = query.orderBy(desc(sites.createdAt)) as typeof query;
  }

  const result = await query.limit(30);

  // 소유자 정보 일괄 조회
  const userIds = [...new Set(result.map((s) => s.userId).filter(Boolean))] as string[];
  const userMap: Record<string, { name: string; imageUrl: string }> = {};

  if (userIds.length > 0) {
    try {
      const client = await clerkClient();
      const users = await client.users.getUserList({ userId: userIds, limit: 100 });
      for (const u of users.data) {
        userMap[u.id] = {
          name: u.firstName || u.username || "",
          imageUrl: u.imageUrl,
        };
      }
    } catch {}
  }

  const enriched = result.map((s) => ({
    ...s,
    owner: s.userId && userMap[s.userId]
      ? userMap[s.userId]
      : null,
  }));

  return NextResponse.json(enriched);
}
