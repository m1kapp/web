"use client";

import { SiteCard, SiteCardSkeleton } from "@/components/site-card";
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
}: {
  sites: RecentSite[] | undefined;
  devMode: boolean;
  stats?: Record<string, SiteKitStats>;
  latestKitVersion: string | null;
}) {
  if (!sites) return <SiteCardSkeleton count={4} />;
  if (sites.length === 0) return <EmptyState message="아직 등록된 사이트가 없어요" />;
  if (devMode) return <DevTable sites={sites} stats={stats} latest={latestKitVersion} />;

  return (
    <div className="space-y-0">
      <div className="flex items-center py-1.5 pr-2 border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
        <span className="flex-1 min-w-0">사이트</span>
        <span className="shrink-0 w-[84px] text-right">TODAY / TOTAL</span>
      </div>
      <div className="divide-y divide-zinc-50 dark:divide-zinc-900">
        {sites.map((site) => (
          <SiteCard key={site.slug} site={site} flat />
        ))}
      </div>
    </div>
  );
}
