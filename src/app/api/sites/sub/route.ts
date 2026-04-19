import { db } from "@/lib/db";
import { sites, hits } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { idToSlug } from "@/lib/utils";
import { handler, ok, unauthorized, badRequest, notFound, forbidden } from "@m1kapp/kit/server";

export const POST = handler(async (req) => {
  const { userId } = await auth();
  if (!userId) unauthorized("로그인이 필요합니다");

  const { parentSlug, path, title } = (await req.json()) as {
    parentSlug?: string;
    path?: string;
    title?: string;
  };

  if (!parentSlug || !path) badRequest("parentSlug과 path가 필요합니다");

  const parent = await db.query.sites.findFirst({
    where: eq(sites.slug, parentSlug!),
  });

  if (!parent) notFound("사이트를 찾을 수 없습니다");
  if (parent!.userId !== userId) forbidden("권한이 없습니다");

  // 정규화: 앞뒤 슬래시 정리
  const normalizedPath = path!.replace(/^\/+|\/+$/g, "");
  if (!normalizedPath) badRequest("올바른 경로를 입력해주세요");

  const existing = await db.query.sites.findFirst({
    where: and(eq(sites.parentId, parent!.id), eq(sites.path, normalizedPath)),
  });

  if (existing) return ok(existing);

  const subUrl = `${parent!.url}/${normalizedPath}`;

  const [sub] = await db
    .insert(sites)
    .values({
      slug: "tmp",
      parentId: parent!.id,
      path: normalizedPath,
      userId: userId!,
      title: title || `/${normalizedPath}`,
      url: subUrl,
      color: parent!.color,
      badgeStyle: parent!.badgeStyle,
      badgeLabel: parent!.badgeLabel,
    })
    .returning();

  const slug = idToSlug(sub.id);
  await db.update(sites).set({ slug }).where(eq(sites.id, sub.id));

  return ok({ ...sub, slug });
});

// 하위 뱃지 목록 조회
export const GET = handler(async (req) => {
  const url = new URL(req.url);
  const parentSlug = url.searchParams.get("parentSlug");

  if (!parentSlug) badRequest("parentSlug이 필요합니다");

  const parent = await db.query.sites.findFirst({
    where: eq(sites.slug, parentSlug!),
  });

  if (!parent) notFound("사이트를 찾을 수 없습니다");

  const subs = await db
    .select({
      slug: sites.slug,
      path: sites.path,
      title: sites.title,
      url: sites.url,
      verified: sites.verified,
      total: sql<number>`coalesce((select sum(${hits.count}) from ${hits} where ${hits.siteId} = ${sites.id}), 0)`,
      createdAt: sites.createdAt,
    })
    .from(sites)
    .where(eq(sites.parentId, parent!.id))
    .orderBy(sites.createdAt);

  return ok(subs);
});
