"use client";

import { StoreTab } from "@/components/tabs/store-tab";
import { useAppTheme } from "../theme-context";
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
      bgColor={bgColor}
      onRefreshItem={handleRefreshItem}
    />
  );
}
