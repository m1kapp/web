import sharp from "sharp";
import { findSiteBySlug } from "@/lib/site-service";

/** 추천 카드용 OG 이미지 축소본 — 사이트마다 원본 크기가 달라 1MB 넘는 PNG도 있다 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await findSiteBySlug(slug);
  // 등록 사이트의 URL만 가져온다 — 임의 URL을 받으면 열린 이미지 프록시가 된다
  if (!site?.verified || !site.ogImage?.startsWith("https://")) return new Response(null, { status: 404 });

  try {
    const res = await fetch(site.ogImage, { signal: AbortSignal.timeout(5000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/") || type.includes("svg")) return new Response(null, { status: 404 });

    const body = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize({ width: 640, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
