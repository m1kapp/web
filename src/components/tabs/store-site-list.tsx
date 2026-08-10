"use client";

import { SiteCardSkeleton } from "@/components/site-card";
import { AppCard } from "@/components/app-card";
import { EmptyState } from "@m1kapp/kit";
import type { RecentSite } from "@/lib/types";
import type { SiteKitStats } from "./store-tab.types";
import { DevTable } from "./dev-table";

/**
 * 목록 영역의 네 가지 상태를 한 곳에서 판정한다.
 * 원래는 호출부에 3중 중첩 삼항(`!sites ? … : length ? (dev ? … : …) : …`)으로 있었다 —
 * "지금 어느 상태인가"를 읽는 게 이 컴포넌트에서 제일 비싼 일이었다. 조기 반환으로 편다.
 */
export function StoreSiteList({
  sites,
  devMode,
  stats,
  latestKitVersion,
  bgColor,
}: {
  sites: RecentSite[] | undefined;
  devMode: boolean;
  stats?: Record<string, SiteKitStats>;
  latestKitVersion: string | null;
  bgColor: string;
}) {
  if (!sites) return <SiteCardSkeleton count={4} />;
  if (sites.length === 0) return <EmptyState message="아직 등록된 사이트가 없어요" />;
  if (devMode) return <DevTable sites={sites} stats={stats} latest={latestKitVersion} />;

  return (
    <div className="space-y-2">
      {sites.map((site) => (
        <AppCard key={site.slug} site={site} bgColor={bgColor} />
      ))}
    </div>
  );
}
