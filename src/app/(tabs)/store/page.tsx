"use client";

import { StoreTab } from "@/components/tabs/store-tab";
import { useAppTheme } from "../theme-context";
import type { RecentSite } from "@/lib/types";

export default function StorePage() {
  const { bgColor } = useAppTheme();

  async function handleRefreshItem(slug: string) {
    await fetch("/api/sites/refresh-og", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
  }

  return (
    <StoreTab
      sites={[] as RecentSite[]}
      bgColor={bgColor}
      onRefreshItem={handleRefreshItem}
    />
  );
}
