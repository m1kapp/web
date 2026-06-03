import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { and, isNotNull, eq } from "drizzle-orm";
import { appHost } from "@/lib/utils";

// 런타임 생성 — 빌드(정적 분석) 단계에서 DB가 없어도 빌드가 깨지지 않게.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = `https://${appHost()}`;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/store`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/badges`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  let siteRoutes: MetadataRoute.Sitemap = [];
  try {
    const allSites = await db.query.sites.findMany({
      where: and(isNotNull(sites.slug), eq(sites.verified, true)),
      columns: { slug: true, createdAt: true },
    });
    siteRoutes = allSites.map((s) => ({
      url: `${base}/${s.slug}`,
      lastModified: s.createdAt ?? new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    }));
  } catch {
    // DB 불가(빌드 등) → 정적 라우트만이라도 반환
  }

  return [...staticRoutes, ...siteRoutes];
}
