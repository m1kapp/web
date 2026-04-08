import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { scrapeOg } from "@/lib/og";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  const body = await request.json();
  const { url } = body as { url?: string };

  const slug = url?.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");

  if (!slug) {
    return NextResponse.json({ error: "URL을 입력해주세요" }, { status: 400 });
  }

  // 이미 등록된 사이트
  const existing = await db.query.sites.findFirst({
    where: eq(sites.slug, slug),
  });

  if (existing) {
    // 소유자 없는 사이트 + 로그인 유저 → 소유권 획득
    if (!existing.userId && userId) {
      await db.update(sites).set({ userId }).where(eq(sites.id, existing.id));
      existing.userId = userId;
    }
    if (!existing.ogTitle && !existing.ogImage) {
      refreshOg(existing.id, slug);
    }
    return NextResponse.json(existing);
  }

  // 신규 등록 + OG 수집
  const og = await scrapeOg(slug);

  const [site] = await db
    .insert(sites)
    .values({
      slug,
      userId: userId || null,
      title: og.title || slug,
      url: `https://${slug}`,
      ogTitle: og.title,
      ogDescription: og.description,
      ogImage: og.image,
    })
    .returning();

  return NextResponse.json(site);
}

async function refreshOg(siteId: number, slug: string) {
  try {
    const og = await scrapeOg(slug);
    if (og.title || og.image) {
      await db
        .update(sites)
        .set({
          title: og.title || slug,
          ogTitle: og.title,
          ogDescription: og.description,
          ogImage: og.image,
        })
        .where(eq(sites.id, siteId));
    }
  } catch {}
}
