import { OGImage, loadPretendard } from "@m1kapp/kit/ogimage";
import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { sites, hits } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";
export const revalidate = 3600;

const DEFAULT_OGIMAGE = (
  <OGImage
    type="default"
    title="방문자 1,000명을 향한 첫걸음"
    sub="배지 하나로 방문자 추적. 목표까지의 여정을 한눈에."
    badge="mini app store"
    appName="m1k"
    color="#ec4899"
    bg="gradient"
    domain="m1k.app"
  />
);

const OG_SIZE = { width: 1200, height: 630 };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const fonts = await loadPretendard([700, 900]);

  if (slug) {
    const site = await db.query.sites.findFirst({
      where: eq(sites.slug, slug),
      columns: { id: true, title: true, color: true, ogTitle: true },
    });

    if (site) {
      const [{ total }] = await db
        .select({ total: sql<number>`coalesce(sum(${hits.count}), 0)` })
        .from(hits)
        .where(eq(hits.siteId, site.id));

      return new ImageResponse(
        <OGImage
          type="stat"
          stat={Number(total).toLocaleString("ko-KR")}
          label={site.ogTitle || site.title || slug}
          sub="방문자 추적 중 · m1k.app"
          appName="m1k"
          color={site.color ?? "#ec4899"}
          bg="gradient"
          domain="m1k.app"
        />,
        { ...OG_SIZE, fonts }
      );
    }
  }

  return new ImageResponse(DEFAULT_OGIMAGE, { ...OG_SIZE, fonts });
}
