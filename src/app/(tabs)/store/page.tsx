import { getCachedRecentSites } from "@/lib/site-service";
import StorePageClient from "./store-page-client";

export default async function StorePage() {
  const [initialSites, initialFeatured] = await Promise.all([
    getCachedRecentSites("total").catch(() => []),
    getCachedRecentSites("today").catch(() => []),
  ]);
  return <StorePageClient initialSites={initialSites} initialFeatured={initialFeatured} />;
}
