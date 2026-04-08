import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites, hits } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const mySites = await db
    .select({
      slug: sites.slug,
      title: sites.title,
      url: sites.url,
      ogTitle: sites.ogTitle,
      ogDescription: sites.ogDescription,
      ogImage: sites.ogImage,
      color: sites.color,
      total: sql<number>`coalesce((select sum(${hits.count}) from ${hits} where ${hits.siteId} = ${sites.id}), 0)`,
      createdAt: sites.createdAt,
    })
    .from(sites)
    .where(eq(sites.userId, userId))
    .orderBy(desc(sites.createdAt));

  return NextResponse.json(mySites);
}
