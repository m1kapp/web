import { getCachedRecentSites } from "@/lib/site-service";
import HomePageClient from "./home-page-client";

export default async function HomePage() {
  return <HomePageClient initialSites={await getCachedRecentSites("total").catch(() => [])} />;
}
