"use client";

import type { Bucket, SiteQuality } from "@/lib/kit-stats-types";
import { SORTS } from "./store-tab.types";
import { useStoreSites } from "./use-store-sites";
import { StoreSiteList } from "./store-site-list";

export type { Bucket, SiteQuality };
export type { Sort, SiteKitStats } from "./store-tab.types";

export function StoreTab({ bgColor }: { bgColor: string }) {
  const { searchQuery, setSearchQuery, sort, setSort, devMode, setDevMode, sites, searching, kitStats } =
    useStoreSites();

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
      <StoreSiteList
        sites={sites}
        devMode={devMode}
        stats={kitStats?.stats}
        latestKitVersion={kitStats?.latestKitVersion ?? null}
      />
    </div>
  );
}
