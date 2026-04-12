import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { desc, gte, isNotNull } from "drizzle-orm";

export const revalidate = 60;

export interface SponsorData {
  slug: string;
  name: string;
  is1k: boolean;
}

export async function GET() {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

  // 1순위: 최근 48h 내 1000 돌파 사이트
  const milestone = await db.query.sites.findFirst({
    where: gte(sites.reached1000At, cutoff),
    orderBy: desc(sites.reached1000At),
    columns: { slug: true, ogTitle: true, title: true, reached1000At: true },
  });

  if (milestone) {
    return NextResponse.json({
      slug: milestone.slug,
      name: milestone.ogTitle || milestone.title || milestone.slug,
      is1k: true,
    } satisfies SponsorData, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
    });
  }

  // 2순위: 최근 등록 10개 중 6시간 슬롯으로 하나 선택
  const recent = await db.query.sites.findMany({
    where: isNotNull(sites.createdAt),
    orderBy: desc(sites.createdAt),
    limit: 10,
    columns: { slug: true, ogTitle: true, title: true },
  });

  if (recent.length === 0) {
    return NextResponse.json(null);
  }

  const slot = Math.floor(Date.now() / (6 * 60 * 60 * 1000)) % recent.length;
  const pick = recent[slot];

  return NextResponse.json({
    slug: pick.slug,
    name: pick.ogTitle || pick.title || pick.slug,
    is1k: false,
  } satisfies SponsorData, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" },
  });
}
