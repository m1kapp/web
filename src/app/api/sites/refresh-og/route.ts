import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { scrapeOg } from "@/lib/og";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { slug } = (await request.json()) as { slug: string };

  const site = await db.query.sites.findFirst({
    where: eq(sites.slug, slug),
  });

  if (!site) {
    return NextResponse.json({ error: "사이트 없음" }, { status: 404 });
  }

  if (site.userId !== userId) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const rawUrl = (site.url || slug).replace(/^https?:\/\//, "");
  const og = await scrapeOg(rawUrl);

  if (og.title || og.image) {
    await db
      .update(sites)
      .set({
        title: og.title || site.title,
        ogTitle: og.title,
        ogDescription: og.description,
        ogImage: og.image,
      })
      .where(eq(sites.id, site.id));
  }

  return NextResponse.json({ ok: true, og });
}
