import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites, hits } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { idToSlug } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { parentSlug, path, title } = (await request.json()) as {
    parentSlug?: string;
    path?: string;
    title?: string;
  };

  if (!parentSlug || !path) {
    return NextResponse.json({ error: "parentSlug과 path가 필요합니다" }, { status: 400 });
  }

  const parent = await db.query.sites.findFirst({
    where: eq(sites.slug, parentSlug),
  });

  if (!parent) {
    return NextResponse.json({ error: "사이트를 찾을 수 없습니다" }, { status: 404 });
  }

  if (parent.userId !== userId) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  // 정규화: 앞뒤 슬래시 정리
  const normalizedPath = path.replace(/^\/+|\/+$/g, "");
  if (!normalizedPath) {
    return NextResponse.json({ error: "올바른 경로를 입력해주세요" }, { status: 400 });
  }

  const existing = await db.query.sites.findFirst({
    where: and(eq(sites.parentId, parent.id), eq(sites.path, normalizedPath)),
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const subUrl = `${parent.url}/${normalizedPath}`;

  const [sub] = await db
    .insert(sites)
    .values({
      slug: "tmp",
      parentId: parent.id,
      path: normalizedPath,
      userId,
      title: title || `/${normalizedPath}`,
      url: subUrl,
      color: parent.color,
      badgeStyle: parent.badgeStyle,
      badgeLabel: parent.badgeLabel,
    })
    .returning();

  const slug = idToSlug(sub.id);
  await db.update(sites).set({ slug }).where(eq(sites.id, sub.id));

  return NextResponse.json({ ...sub, slug });
}

// 하위 뱃지 목록 조회
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const parentSlug = url.searchParams.get("parentSlug");

  if (!parentSlug) {
    return NextResponse.json({ error: "parentSlug이 필요합니다" }, { status: 400 });
  }

  const parent = await db.query.sites.findFirst({
    where: eq(sites.slug, parentSlug),
  });

  if (!parent) {
    return NextResponse.json({ error: "사이트를 찾을 수 없습니다" }, { status: 404 });
  }

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
    .where(eq(sites.parentId, parent.id))
    .orderBy(sites.createdAt);

  return NextResponse.json(subs);
}
