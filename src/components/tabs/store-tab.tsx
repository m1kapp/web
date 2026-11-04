"use client";

import { useFetch } from "@m1kapp/kit";
import { compactNumber } from "@/lib/format";
import { slugToColor } from "@/lib/site-color";
import { SiteThumbnail } from "@/components/site-preview-card";
import type { Bucket, SiteQuality } from "@/lib/kit-stats-types";
import type { RecentSite } from "@/lib/types";
import { SORTS } from "./store-tab.types";
import { useStoreSites } from "./use-store-sites";
import { StoreSiteList } from "./store-site-list";

export type { Bucket, SiteQuality };
export type { Sort, SiteKitStats } from "./store-tab.types";

export function StoreTab({
  bgColor,
  initialSites,
  initialFeatured,
}: {
  bgColor: string;
  initialSites: RecentSite[];
  initialFeatured: RecentSite[];
}) {
  const { searchQuery, setSearchQuery, sort, setSort, devMode, setDevMode, sites, searching, kitStats } =
    useStoreSites(initialSites);

  return (
    <div className="py-3">
      {/* 검색 */}
      <div className="relative mx-4 mb-4">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          aria-label="앱 검색"
          placeholder="앱 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 w-full rounded-xl bg-zinc-100 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500 dark:focus:ring-zinc-600"
        />
      </div>

      {!searchQuery && !devMode && <Featured initial={initialFeatured} />}

      {/* 정렬 + dev 토글 */}
      <div className="mx-4 mb-1 flex items-center gap-2">
        <div className="flex flex-1 rounded-xl bg-zinc-100 p-0.5 dark:bg-zinc-800">
          {SORTS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSort(s.value)}
              aria-pressed={sort === s.value}
              className={`h-8 flex-1 rounded-[10px] text-xs font-bold transition-colors ${
                sort === s.value
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-600 dark:text-white"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setDevMode((v) => !v)}
          title="dev 모드 — 사이트별 kit 버전·규모·청결도 비교"
          aria-pressed={devMode}
          className={`h-9 shrink-0 rounded-xl px-3 font-mono text-xs font-semibold transition-colors ${
            devMode ? "text-white" : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
          }`}
          style={devMode ? { background: bgColor } : undefined}
        >
          kit
        </button>
      </div>
      {searching && <p className="mx-4 mt-2 text-xs text-zinc-400">검색 중...</p>}

      {/* 목록 */}
      <div className="px-4">
        <StoreSiteList
          sites={sites}
          devMode={devMode}
          stats={kitStats?.stats}
          latestKitVersion={kitStats?.latestKitVersion ?? null}
          bgColor={bgColor}
          ranked={sort !== "recent" && !searchQuery}
        />
      </div>
    </div>
  );
}

/** 앱스토어의 투데이 자리 — 오늘 방문 상위 앱을 스크린샷(OG 이미지)과 함께 크게 보여준다 */
function Featured({ initial }: { initial: RecentSite[] }) {
  const { data } = useFetch<RecentSite[]>("/api/sites/recent?sort=today", { staleTime: 60 * 1000 });
  const featured = (data ?? initial).filter((s) => s.userId && s.ogImage && s.today).slice(0, 5);

  if (!featured.length) return null;

  return (
    <div className="mb-5 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto px-4 scrollbar-hide">
      {featured.map((site) => (
        <FeaturedCard key={site.slug} site={site} />
      ))}
    </div>
  );
}

function FeaturedCard({ site }: { site: RecentSite }) {
  const name = site.ogTitle || site.title || site.slug;
  const color = site.color || slugToColor(site.slug);

  return (
    <a href={`/${site.slug}`} className="w-[82%] shrink-0 snap-start">
      <span className="block aspect-[1.91/1] overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        {/* 축소본을 먼저 쓰고, 실패하면 원본, 원본도 깨지면 숨긴다 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/og-thumb/${site.slug}`}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          onError={(e) => {
            const original = site.ogImage ?? "";
            if (original && e.currentTarget.src !== original) e.currentTarget.src = original;
            else e.currentTarget.style.display = "none";
          }}
        />
      </span>
      <span className="mt-2 flex items-center gap-2.5">
        <SiteThumbnail slug={site.slug} name={name} faviconUrl={site.faviconUrl} color={color} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-bold text-zinc-900 dark:text-white" title={name}>
            {name}
          </span>
          <span className="block text-[11px] font-bold tabular-nums text-emerald-500">
            오늘 +{compactNumber(site.today ?? 0)}
          </span>
        </span>
      </span>
    </a>
  );
}
