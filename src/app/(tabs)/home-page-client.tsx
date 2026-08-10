"use client";

import { useRouter } from "next/navigation";
import { useFetch } from "@m1kapp/kit";
import { HomeTab } from "@/components/tabs/home-tab";
import { useAppTheme } from "./theme-context";
import type { RecentSite } from "@/lib/types";

export default function HomePageClient() {
  const router = useRouter();
  const { bgColor } = useAppTheme();

  const { data: recentSites } = useFetch<RecentSite[]>("/api/sites/recent");
  // 자기 사이트 slug는 사실상 고정값 — 하루 동안 재검증 생략
  const { data: self } = useFetch<{ slug: string | null }>("/api/sites/self", {
    staleTime: 24 * 60 * 60 * 1000,
  });

  return (
    <HomeTab
      bgColor={bgColor}
      recentSites={recentSites ?? []}
      selfSlug={self?.slug ?? null}
      onStart={() => router.push("/my")}
      onBrowseApps={() => router.push("/store")}
    />
  );
}
