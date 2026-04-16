import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { and, isNotNull, eq } from "drizzle-orm";
import { appHost } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = `https://${appHost()}`;

  const allSites = await db.query.sites.findMany({
    where: and(isNotNull(sites.slug), eq(sites.verified, true)),
    columns: { slug: true, createdAt: true },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${base}/store`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/badges`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  ];

  const siteRoutes: MetadataRoute.Sitemap = allSites.map((s) => ({
    url: `${base}/${s.slug}`,
    lastModified: s.createdAt ?? new Date(),
    changeFrequency: "daily",
    priority: 0.6,
  }));

  return [...staticRoutes, ...siteRoutes];
}
