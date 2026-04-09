"use client";

import { useState, useEffect } from "react";
import { SiteCard } from "@/components/site-card";
import { Divider, EmptyState } from "@m1kapp/ui";
import type { RecentSite } from "@/lib/types";

export function StoreTab({
  sites: initialSites,
  onRefreshItem,
  bgColor,
}: {
  sites: RecentSite[];
  onRefreshItem: (slug: string) => Promise<void>;
  bgColor: string;
}) {
  const [refreshingSlug, setRefreshingSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "popular" | "name">("recent");
  const [filteredSites, setFilteredSites] = useState<RecentSite[]>(initialSites);
  const [searching, setSearching] = useState(false);
  const [ranking, setRanking] = useState<RecentSite[]>([]);

  useEffect(() => {
    fetch("/api/sites/recent?sort=popular")
      .then((res) => res.json())
      .then((data) => Array.isArray(data) ? setRanking(data.slice(0, 5)) : setRanking([]))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (sort !== "recent") params.set("sort", sort);

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/sites/recent?${params}`);
        setFilteredSites(await res.json());
      } catch {}
      setSearching(false);
    }, searchQuery ? 300 : 0);

    return () => clearTimeout(timeout);
  }, [searchQuery, sort]);

  useEffect(() => {
    if (!searchQuery && sort === "recent") setFilteredSites(initialSites);
  }, [initialSites, searchQuery, sort]);

  const sites = filteredSites;

  return (
    <div className="px-4 py-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">탐색</h2>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">등록된 사이트를 둘러보세요</p>
      </div>

      {/* 1K 레이스 랭킹 */}
      {ranking.length > 0 && !searchQuery && (
        <div className="mb-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: bgColor }}>
            1K 레이스
          </h3>
          <div className="space-y-1.5">
            {ranking.map((site, i) => {
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
              const progress = Math.min(Number(site.total) / 1000, 1);
              return (
                <a
                  key={site.slug}
                  href={`/${site.slug}`}
                  className="flex items-center gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-base w-6 text-center shrink-0">{medal}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                      {site.ogTitle || site.title || site.slug}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.max(progress * 100, 1)}%`, backgroundColor: bgColor }}
                        />
                      </div>
                      <span className="text-[10px] tabular-nums font-semibold text-zinc-500 shrink-0">
                        {Number(site.total).toLocaleString()} / 1K
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
          <Divider />
        </div>
      )}

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
        {([
          { value: "recent", label: "최신순" },
          { value: "popular", label: "인기순" },
          { value: "name", label: "이름순" },
        ] as const).map((s) => (
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

      {sites.length > 0 ? (
        <div className="space-y-3">
          {sites.map((site) => (
            <SiteCard
              key={site.slug}
              slug={site.slug}
              title={site.title}
              ogTitle={site.ogTitle}
              ogDescription={site.ogDescription}
              ogImage={site.ogImage}
              color={site.color}
              owner={site.owner}
              actions={
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setRefreshingSlug(site.slug);
                    await onRefreshItem(site.slug);
                    setRefreshingSlug(null);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors flex items-center gap-2"
                >
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={refreshingSlug === site.slug ? "animate-spin" : ""}
                  >
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 16h5v5" />
                  </svg>
                  {refreshingSlug === site.slug ? "새로고침 중..." : "OG 새로고침"}
                </button>
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState message="아직 등록된 사이트가 없어요" />
      )}
    </div>
  );
}
