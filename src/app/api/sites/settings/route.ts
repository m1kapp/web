import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites, hits, hitLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

export async function PUT(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const body = await request.json();
  const { slug, color, badgeStyle, badgeLabel, badgeEmoji } = body as {
    slug: string;
    color?: string;
    badgeStyle?: string;
    badgeLabel?: string;
    badgeEmoji?: string | null;
  };

  if (!slug) {
    return NextResponse.json({ error: "slug 필요" }, { status: 400 });
  }

  const site = await db.query.sites.findFirst({
    where: eq(sites.slug, slug),
  });

  if (!site) {
    return NextResponse.json({ error: "사이트 없음" }, { status: 404 });
  }

  if (site.userId !== userId) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const updates: Record<string, string | null> = {};
  if (color) updates.color = color;
  if (badgeStyle) updates.badgeStyle = badgeStyle;
  if (badgeLabel) updates.badgeLabel = badgeLabel;
  if (badgeEmoji !== undefined) updates.badgeEmoji = badgeEmoji;

  if (Object.keys(updates).length > 0) {
    await db.update(sites).set(updates).where(eq(sites.id, site.id));
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { slug } = (await request.json()) as { slug?: string };

  if (!slug) {
    return NextResponse.json({ error: "slug 필요" }, { status: 400 });
  }

  const site = await db.query.sites.findFirst({
    where: eq(sites.slug, slug),
  });

  if (!site) {
    return NextResponse.json({ error: "사이트 없음" }, { status: 404 });
  }

  if (site.userId !== userId) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  // hitLogs → hits → sites 순서로 삭제 (FK 제약)
  await db.delete(hitLogs).where(eq(hitLogs.siteId, site.id));
  await db.delete(hits).where(eq(hits.siteId, site.id));
  await db.delete(sites).where(eq(sites.id, site.id));

  return NextResponse.json({ ok: true });
}
