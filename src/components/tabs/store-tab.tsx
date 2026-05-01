"use client";

import { useState } from "react";
import { SiteCard, SiteCardSkeleton } from "@/components/site-card";
import { EmptyState } from "@m1kapp/kit";
import { useFetch, useDebounce } from "@m1kapp/kit";
import type { RecentSite } from "@/lib/types";

type Sort = "total" | "today" | "boosted";

const SORTS: { value: Sort; label: string }[] = [
  { value: "total", label: "총 방문순" },
  { value: "today", label: "오늘 방문순" },
  { value: "boosted", label: "부스트순" },
];

export function StoreTab({
  bgColor,
}: {
  bgColor: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<Sort>("total");
  const debouncedQuery = useDebounce(searchQuery, 300);

  const params = new URLSearchParams();
  if (debouncedQuery) params.set("q", debouncedQuery);
  params.set("sort", sort);

  const { data: sites, loading: searching } = useFetch<RecentSite[]>(`/api/sites/recent?${params}`);

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

      {/* 정렬 */}
      <div className="flex gap-1.5 mb-4">
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
        {searching && <span className="text-xs text-zinc-300 self-center ml-auto">검색 중...</span>}
      </div>

      {/* 목록 */}
      {!sites ? (
        <SiteCardSkeleton count={4} />
      ) : sites.length > 0 ? (
        <div className="space-y-0">
          {sites.map((site) => (
            <SiteCard key={site.slug} site={site} />
          ))}
        </div>
      ) : (
        <EmptyState message="아직 등록된 사이트가 없어요" />
      )}
    </div>
  );
}
