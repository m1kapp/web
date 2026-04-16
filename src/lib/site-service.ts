import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites, hits, hitLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export type Site = typeof sites.$inferSelect;

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
