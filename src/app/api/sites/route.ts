import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { scrapeOg } from "@/lib/og";
import { auth } from "@clerk/nextjs/server";
import { idToSlug } from "@/lib/utils";
import dns from "dns/promises";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const body = await request.json();
  const { url } = body as { url?: string };

  const rawUrl = url?.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");

  if (!rawUrl) {
    return NextResponse.json({ error: "URL을 입력해주세요" }, { status: 400 });
  }

  const fullUrl = `https://${rawUrl}`;

  // 도메인 존재 확인 (DNS 조회)
  const hostname = rawUrl.split("/")[0];
  try {
    await dns.resolve(hostname);
  } catch {
    return NextResponse.json({ error: "존재하지 않는 도메인이에요" }, { status: 400 });
  }

  // 이미 등록된 사이트 (URL 기준)
  const existing = await db.query.sites.findFirst({
    where: eq(sites.url, fullUrl),
  });

  if (existing) {
    if (existing.userId !== userId) {
      return NextResponse.json({ error: "이미 다른 사용자가 등록한 사이트예요" }, { status: 409 });
    }
    return NextResponse.json(existing);
  }

  // 신규 등록 + OG 수집
  const og = await scrapeOg(rawUrl);

  const [site] = await db
    .insert(sites)
    .values({
      slug: "tmp",
      userId,
      title: og.title || rawUrl,
      url: fullUrl,
      ogTitle: og.title,
      ogDescription: og.description,
      ogImage: og.image,
    })
    .returning();

  // id 기반 base62 slug 부여
  const slug = idToSlug(site.id);
  await db.update(sites).set({ slug }).where(eq(sites.id, site.id));

  return NextResponse.json({ ...site, slug });
}
