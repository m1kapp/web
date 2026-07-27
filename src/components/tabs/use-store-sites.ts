"use client";

import { useState } from "react";
import { useFetch, useDebounce, useLocalStorage } from "@m1kapp/kit";
import type { RecentSite } from "@/lib/types";
import type { KitStatsPayload, Sort } from "./store-tab.types";

/**
 * 스토어 탭의 데이터 계층 — 검색어·정렬·dev 토글과 그에 딸린 fetch.
 * 렌더에서 분리해 둔 이유: 이 파일은 자주 바뀌는데(churn 26) 쿼리 하나 고치려고
 * JSX 전체를 읽을 필요가 없어야 한다.
 */
export function useStoreSites() {
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

  return { searchQuery, setSearchQuery, sort, setSort, devMode, setDevMode, sites, searching, kitStats };
}
