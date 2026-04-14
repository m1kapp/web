import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites, hits } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const [mySites, client] = await Promise.all([
    db
      .select({
        slug: sites.slug,
        title: sites.title,
        url: sites.url,
        ogTitle: sites.ogTitle,
        ogDescription: sites.ogDescription,
        ogImage: sites.ogImage,
        color: sites.color,
        total: sql<number>`coalesce(sum(${hits.count}), 0)`,
        createdAt: sites.createdAt,
      })
      .from(sites)
      .leftJoin(hits, eq(hits.siteId, sites.id))
      .where(eq(sites.userId, userId))
      .groupBy(sites.id)
      .orderBy(desc(sites.createdAt)),
    clerkClient(),
  ]);

  let owner: { name: string; imageUrl: string } | null = null;
  try {
    const user = await client.users.getUser(userId);
    owner = { name: user.firstName || user.username || "", imageUrl: user.imageUrl };
  } catch (e) { console.error("[mine] clerk user fetch failed:", e); }

  return NextResponse.json(mySites.map((s) => ({ ...s, owner })));
}
