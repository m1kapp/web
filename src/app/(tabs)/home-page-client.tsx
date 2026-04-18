"use client";

import { useRouter } from "next/navigation";
import { HomeTab } from "@/components/tabs/home-tab";
import { useAppTheme } from "./theme-context";
import type { RecentSite } from "@/lib/types";

interface Props {
  recentSites: RecentSite[];
  selfSlug: string | null;
}

export default function HomePageClient({ recentSites, selfSlug }: Props) {
  const router = useRouter();
  const { bgColor } = useAppTheme();

  return (
    <HomeTab
      bgColor={bgColor}
      recentSites={recentSites}
      selfSlug={selfSlug}
      onStart={() => router.push("/my")}
    />
  );
}
