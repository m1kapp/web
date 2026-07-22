"use client";

import { useState } from "react";
import { SiteCard, SiteCardSkeleton } from "@/components/site-card";
import { EmptyState } from "@m1kapp/kit";
import { useFetch, useDebounce, useLocalStorage } from "@m1kapp/kit";
import type { RecentSite } from "@/lib/types";
import type { Bucket, SiteQuality } from "@/lib/kit-stats-types";
import { DevTable } from "./dev-table";

export type { Bucket, SiteQuality };

type Sort = "total" | "today";

const SORTS: { value: Sort; label: string }[] = [
  { value: "total", label: "총 방문순" },
  { value: "today", label: "오늘 방문순" },
];

export interface SiteKitStats {
  kitVersion: string;
  files: number | null;
  codeLines: number | null;
  breakdown: { frontend: Bucket; backend: Bucket; shared: Bucket } | null;
  savedPercent: number | null;
  quality: SiteQuality | null;
}

interface KitStatsPayload {
  latestKitVersion: string | null;
  stats: Record<string, SiteKitStats>;
}

export function StoreTab({
  bgColor,
}: {
  bgColor: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<Sort>("total");
  const [devMode, setDevMode] = useLocalStorage("m1k:store-dev-mode", false);
  const debouncedQuery = useDebounce(searchQuery, 300);

  const params = new URLSearchParams();
  if (debouncedQuery) params.set("q", debouncedQuery);
  params.set("sort", sort);

  const { data: sites, loading: searching } = useFetch<RecentSite[]>(`/api/sites/recent?${params}`);
  // dev 모드 켤 때만 수집 API 호출 (서버가 1h Redis 캐시)
  const { data: kitStats } = useFetch<KitStatsPayload>(devMode ? "/api/sites/kit-stats" : null, {
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="px-4 py-3">
      {/* 검색 */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="사이트 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
        />
      </div>

      {/* 정렬 + dev 토글 */}
      <div className="flex items-center gap-1.5 mb-4">
        {SORTS.map((s) => (
          <button
            key={s.value}
            onClick={() => setSort(s.value)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              sort === s.value
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {s.label}
          </button>
        ))}
        {searching && <span className="text-xs text-zinc-300 self-center ml-2">검색 중...</span>}
        <span className="flex-1" />
        <button
          onClick={() => setDevMode((v) => !v)}
          title="dev 모드 — 사이트별 kit 버전·규모·청결도 비교"
          className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors border ${
            devMode
              ? "text-white border-transparent"
              : "bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700"
          }`}
          style={devMode ? { background: bgColor } : undefined}
        >
          kit
        </button>
      </div>

      {/* 목록 */}
      {!sites ? (
        <SiteCardSkeleton count={4} />
      ) : sites.length > 0 ? (
        devMode ? (
          <DevTable sites={sites} stats={kitStats?.stats} latest={kitStats?.latestKitVersion ?? null} />
        ) : (
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
        )
      ) : (
        <EmptyState message="아직 등록된 사이트가 없어요" />
      )}
    </div>
  );
}
