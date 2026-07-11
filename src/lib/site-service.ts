import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites, hits, hitLogs } from "@/lib/db/schema";
import { sql, desc, ilike, or, eq, and } from "drizzle-orm";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { todayKST } from "@/lib/format";
import { getBufferedMap } from "@/lib/hit-buffer";
import type { RecentSite } from "@/lib/types";

export type Site = typeof sites.$inferSelect;

export interface FetchRecentSitesOptions {
  q?: string;
  sort?: "total" | "today";
}

export async function fetchRecentSites({
  q = "",
  sort = "total",
}: FetchRecentSitesOptions = {}): Promise<RecentSite[]> {
  const todayStr = todayKST();

  const totalExpr = sql<number>`coalesce(sum(${hits.count}), 0)`;
  const todayExpr = sql<number>`coalesce(sum(case when ${hits.date} = ${todayStr} then ${hits.count} else 0 end), 0)`;

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
      id: sites.id,
      slug: sites.slug,
      title: sites.title,
      url: sites.url,
      ogTitle: sites.ogTitle,
      ogDescription: sites.ogDescription,
      ogImage: sites.ogImage,
      faviconUrl: sites.faviconUrl,
      color: sites.color,
      userId: sites.userId,
      total: totalExpr,
      today: todayExpr,
      createdAt: sites.createdAt,
    })
    .from(sites)
    .leftJoin(hits, eq(hits.siteId, sites.id))
    .where(whereCondition)
    .groupBy(sites.id);

  if (sort === "today") {
    query = query.orderBy(desc(todayExpr), desc(totalExpr)) as typeof query;
  } else {
    query = query.orderBy(desc(totalExpr)) as typeof query;
  }

  const result = await query.limit(30);

  // hits 테이블은 flush 크론(주기적) 이후에만 반영됨 — 그 사이 새로 쌓인 hit은
  // Redis 버퍼에만 있어서 안 더하면 사이트 자체 배지(count 뷰)보다 낮게 보임.
  const buffered = await getBufferedMap(result.map((s) => s.id), todayStr);
  for (const s of result) {
    const b = buffered.get(s.id);
    if (b) {
      s.total = Number(s.total) + b.total;
      s.today = Number(s.today) + b.today;
    }
  }
  if (sort === "today") result.sort((a, b) => Number(b.today) - Number(a.today) || Number(b.total) - Number(a.total));
  else result.sort((a, b) => Number(b.total) - Number(a.total));

  const userIds = [...new Set(result.map((s) => s.userId).filter(Boolean))] as string[];
  const userMap: Record<string, { name: string; imageUrl: string }> = {};

  if (userIds.length > 0) {
    try {
      const client = await clerkClient();
      const users = await client.users.getUserList({ userId: userIds, limit: 100 });
      for (const u of users.data) {
        userMap[u.id] = { name: u.firstName || u.username || "", imageUrl: u.imageUrl };
      }
    } catch (e) {
      console.error("[fetchRecentSites] clerk user fetch failed:", e);
    }
  }

  return result.map(({ id: _id, ...s }) => ({
    ...s,
    owner: s.userId && userMap[s.userId] ? userMap[s.userId] : null,
  }));
}

/** slug로 사이트 단건 조회 */
export async function findSiteBySlug(slug: string): Promise<Site | undefined> {
  return db.query.sites.findFirst({ where: eq(sites.slug, slug) });
}

type SiteOwnerResult =
  | { site: Site; error: null }
  | { site: null; error: NextResponse };

/**
 * 인증 + 사이트 조회 + 소유권 확인을 한 번에 처리.
 * settings/route.ts의 PUT, DELETE 양쪽에서 공용으로 사용.
 *
 * @example
 * const { site, error } = await requireSiteOwner(slug);
 * if (error) return error;
 */
export async function requireSiteOwner(slug: string): Promise<SiteOwnerResult> {
  const { userId } = await auth();

  if (!userId) {
    return {
      site: null,
      error: NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 }),
    };
  }

  const site = await findSiteBySlug(slug);

  if (!site) {
    return {
      site: null,
      error: NextResponse.json({ error: "사이트 없음" }, { status: 404 }),
    };
  }

  if (site.userId !== userId) {
    return {
      site: null,
      error: NextResponse.json({ error: "권한이 없습니다" }, { status: 403 }),
    };
  }

  return { site, error: null };
}

/** hitLogs → hits → sites 순서로 삭제 (FK 제약 순서) */
export async function deleteSiteWithCascade(siteId: number): Promise<void> {
  await db.delete(hitLogs).where(eq(hitLogs.siteId, siteId));
  await db.delete(hits).where(eq(hits.siteId, siteId));
  await db.delete(sites).where(eq(sites.id, siteId));
}

/** total이 1000 이상이고 아직 기록되지 않은 경우 reached_1000_at 기록 */
export async function recordMilestoneIfReached(
  site: Pick<Site, "id" | "reached1000At">,
  total: number,
): Promise<void> {
  if (total >= 1000 && !site.reached1000At) {
    await db.update(sites).set({ reached1000At: new Date() }).where(eq(sites.id, site.id));
  }
}
