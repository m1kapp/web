"use client";

import { StoreTab } from "@/components/tabs/store-tab";
import type { RecentSite } from "@/lib/types";
import { useAppTheme } from "../theme-context";

export default function StorePageClient({
  initialSites,
  initialFeatured,
}: {
  initialSites: RecentSite[];
  initialFeatured: RecentSite[];
}) {
  const { bgColor } = useAppTheme();
  return <StoreTab bgColor={bgColor} initialSites={initialSites} initialFeatured={initialFeatured} />;
}
