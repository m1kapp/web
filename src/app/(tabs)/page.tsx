"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HomeTab } from "@/components/tabs/home-tab";
import { useAppTheme } from "./theme-context";
import type { RecentSite } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const { bgColor } = useAppTheme();
  const [recentSites, setRecentSites] = useState<RecentSite[]>([]);
  const [selfSlug, setSelfSlug] = useState<string | null>(null);

  useEffect(() => {
    setSelfSlug(document.body.dataset.selfSlug || null);
  }, []);

  useEffect(() => {
    fetch("/api/sites/recent")
      .then(r => r.json())
      .then(setRecentSites)
      .catch(() => {});
  }, []);

  return (
    <HomeTab
      bgColor={bgColor}
      recentSites={recentSites}
      selfSlug={selfSlug}
      onStart={() => router.push("/my")}
    />
  );
}
