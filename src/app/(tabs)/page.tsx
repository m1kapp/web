import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { fetchRecentSites } from "@/lib/site-service";
import HomePageClient from "./home-page-client";

export default async function HomePage() {
  const [recentSites, selfSite] = await Promise.all([
    fetchRecentSites(),
    db.query.sites.findFirst({
      where: eq(sites.url, "https://m1k.app"),
      columns: { slug: true },
    }),
  ]);

  return (
    <HomePageClient
      recentSites={recentSites}
      selfSlug={selfSite?.slug ?? null}
    />
  );
}
