import { db } from "@/lib/db";
import { sites, hits } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { handler, ok, unauthorized } from "@m1kapp/kit/server";
import { todayKST } from "@/lib/format";

export const GET = handler(async () => {
  const { userId } = await auth();
  if (!userId) unauthorized("로그인이 필요합니다");
  const todayStr = todayKST();
  const totalExpr = sql<number>`coalesce(sum(${hits.count}), 0)`;
  const todayExpr = sql<number>`coalesce(sum(case when ${hits.date} = ${todayStr} then ${hits.count} else 0 end), 0)`;

  const [mySites, client] = await Promise.all([
    db
      .select({
        slug: sites.slug,
        title: sites.title,
        url: sites.url,
        ogTitle: sites.ogTitle,
        ogDescription: sites.ogDescription,
        ogImage: sites.ogImage,
        faviconUrl: sites.faviconUrl,
        color: sites.color,
        total: totalExpr,
        today: todayExpr,
        createdAt: sites.createdAt,
      })
      .from(sites)
      .leftJoin(hits, eq(hits.siteId, sites.id))
      .where(eq(sites.userId, userId!))
      .groupBy(sites.id)
      .orderBy(desc(sites.createdAt)),
    clerkClient(),
  ]);

  let owner: { name: string; imageUrl: string } | null = null;
  try {
    const user = await client.users.getUser(userId!);
    owner = { name: user.firstName || user.username || "", imageUrl: user.imageUrl };
  } catch (e) { console.error("[mine] clerk user fetch failed:", e); }

  return ok(mySites.map((s) => ({ ...s, owner })));
});
