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

interface SiteKitStats {
  kitVersion: string;
  files: number | null;
  codeLines: number | null;
  savedPercent: number | null;
  quality: { score: number; grade: string; branchDensity: number } | null;
}

interface KitStatsPayload {
  latestKitVersion: string | null;
  stats: Record<string, SiteKitStats>;
}

function versionBehind(v: string, latest: string | null): boolean {
  if (!latest) return false;
  const a = v.split(".").map(Number);
  const b = latest.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) < (b[i] ?? 0)) return true;
    if ((a[i] ?? 0) > (b[i] ?? 0)) return false;
  }
  return false;
}

/** dev 모드에서 사이트 카드 아래 붙는 kit 지표 스트립 */
function DevStrip({ s, latest }: { s: SiteKitStats | undefined; latest: string | null }) {
  if (!s) {
    return <p className="text-[10px] text-zinc-300 dark:text-zinc-600 pl-[52px] -mt-1 pb-1 font-mono">kit-stats 없음</p>;
  }
  const behind = versionBehind(s.kitVersion, latest);
  return (
    <p className="text-[10px] pl-[52px] -mt-1 pb-1 font-mono text-zinc-400 dark:text-zinc-500 truncate">
      <span className={behind ? "text-amber-500 font-semibold" : "text-emerald-600 dark:text-emerald-500"}>
        v{s.kitVersion}{behind && `→${latest}`}
      </span>
      {s.codeLines != null && <> · {s.codeLines.toLocaleString()}줄</>}
      {s.files != null && <> · {s.files}파일</>}
      {s.savedPercent != null && <> · kit {s.savedPercent}%</>}
      {s.quality && <> · 청결 {s.quality.grade}({s.quality.score})</>}
    </p>
  );
}

export function StoreTab({
  bgColor,
}: {
  bgColor: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<Sort>("total");
  const [devMode, setDevMode] = useState(false);
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
      {/* 검색 + dev 토글 */}
      <div className="mb-3 flex items-center gap-2">
        <input
          type="text"
          placeholder="사이트 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
        />
        <button
          onClick={() => setDevMode((v) => !v)}
          title="dev 모드 — 사이트별 kit 버전·규모·청결도 비교"
          className={`shrink-0 px-2.5 py-2 rounded-lg text-xs font-mono font-semibold transition-colors border ${
            devMode
              ? "text-white border-transparent"
              : "bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700"
          }`}
          style={devMode ? { background: bgColor } : undefined}
        >
          {"</>"}
        </button>
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
        {devMode && kitStats?.latestKitVersion && (
          <span className="text-[10px] font-mono text-zinc-400 self-center ml-auto">
            latest v{kitStats.latestKitVersion}
          </span>
        )}
      </div>

      {/* 목록 */}
      {!sites ? (
        <SiteCardSkeleton count={4} />
      ) : sites.length > 0 ? (
        <div className="space-y-0">
          {sites.map((site) => (
            <div key={site.slug}>
              <SiteCard site={site} />
              {devMode && (
                <DevStrip s={kitStats?.stats?.[site.slug]} latest={kitStats?.latestKitVersion ?? null} />
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="아직 등록된 사이트가 없어요" />
      )}
    </div>
  );
}
