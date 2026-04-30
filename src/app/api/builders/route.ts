import { db } from "@/lib/db";
import { sites, hits } from "@/lib/db/schema";
import { sql, desc, eq, isNotNull } from "drizzle-orm";
import { handler, ok } from "@m1kapp/kit/server";
import { todayKST } from "@/lib/format";

export type BuilderSite = {
  slug: string;
  title: string | null;
  ogTitle: string | null;
  faviconUrl: string | null;
  color: string | null;
  url: string | null;
  total: number;
};

export type Builder = {
  userId: string;
  name: string | null;
  handle: string | null;
  imageUrl: string | null;
  siteCount: number;
  totalHits: number;
  sites: BuilderSite[];
};

export const GET = handler(async () => {
  const todayStr = todayKST();

  // userId별 총 방문자 + 앱 목록
  const rows = await db
    .select({
      userId: sites.userId,
      ownerName: sites.ownerName,
      ownerHandle: sites.ownerHandle,
      ownerImageUrl: sites.ownerImageUrl,
      slug: sites.slug,
      title: sites.title,
      ogTitle: sites.ogTitle,
      faviconUrl: sites.faviconUrl,
      color: sites.color,
      url: sites.url,
      total: sql<number>`coalesce(sum(${hits.count}), 0)`,
    })
    .from(sites)
    .leftJoin(hits, eq(hits.siteId, sites.id))
    .where(sql`${sites.userId} is not null and ${sites.verified} = true`)
    .groupBy(sites.id)
    .orderBy(desc(sql<number>`coalesce(sum(${hits.count}), 0)`));

  // userId로 그룹핑
  const builderMap = new Map<string, Builder>();
  for (const row of rows) {
    if (!row.userId) continue;
    if (!builderMap.has(row.userId)) {
      builderMap.set(row.userId, {
        userId: row.userId,
        name: row.ownerName,
        handle: row.ownerHandle,
        imageUrl: row.ownerImageUrl,
        siteCount: 0,
        totalHits: 0,
        sites: [],
      });
    }
    const builder = builderMap.get(row.userId)!;
    const total = Number(row.total);
    builder.siteCount += 1;
    builder.totalHits += total;
    builder.sites.push({
      slug: row.slug,
      title: row.title,
      ogTitle: row.ogTitle,
      faviconUrl: row.faviconUrl,
      color: row.color,
      url: row.url,
      total,
    });
  }

  // 총 방문자 내림차순으로 정렬
  const builders = [...builderMap.values()]
    .sort((a, b) => b.totalHits - a.totalHits)
    .slice(0, 50);

  return ok(builders);
});
