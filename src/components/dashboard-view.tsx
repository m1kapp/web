"use client";

import { useState, useEffect, useRef } from "react";
import { Watermark, AppShell, Section, Divider, useFetch } from "@m1kapp/kit";
import { AccentProvider, type AccentHex } from "@/lib/theme-context";
import { SiteHero } from "./site-hero";
import { BoostButton } from "./boost-button";
import { StatsSections, OwnerSection } from "./dashboard-sections";
import { BadgeEditor } from "./badge-editor";
import { DashboardHeader, KitCodeSection, type KitStatsPayload } from "./dashboard-chrome";

const POLL_INTERVAL_MS = 30_000;

export interface SiteData {
  slug: string;
  title: string | null;
  url: string | null;
  total: number;
  weekly: number;
  monthly: number;
  daily: { date: string; count: number }[];
  countries: { country: string | null; count: number }[];
  devices: { device: string | null; count: number }[];
  referers: { referer: string | null; count: number }[];
  browsers: { browser: string | null; count: number }[];
  os: { os: string | null; count: number }[];
  cities: { city: string | null; count: number }[];
  hourly: { hour: number; count: number }[];
  createdAt: string | null;
  color: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  faviconUrl: string | null;
  badgeStyle: string | null;
  badgeColor: string | null;
  userId: string | null;
  todayCount: number;
  verified: boolean;
  parentId: number | null;
  boosted: number;
  ownerHandle: string | null;
  ownerName: string | null;
  ownerImageUrl: string | null;
}

interface DashboardViewProps {
  data: SiteData;
  host: string;
  isOwner?: boolean;
  isSignedIn?: boolean;
  owner?: { handle: string; name: string; imageUrl: string } | null;
}

/** 30초 폴링 + boost 완료 이벤트로 카운트 갱신. 값 변화 없으면 리렌더 안 함 */
function useLiveCounts(initialData: SiteData): SiteData {
  const [data, setData] = useState(initialData);

  const slugRef = useRef(data.slug);
  slugRef.current = data.slug;

  useEffect(() => {
    async function refresh() {
      try {
        const res = await fetch(`/api/sites/${slugRef.current}`);
        if (!res.ok) return;
        const fresh = await res.json();
        setData((prev) => mergeCounts(prev, fresh));
      } catch (e) { console.error("[dashboard] poll failed:", e); }
    }

    const interval = setInterval(() => { if (!document.hidden) refresh(); }, POLL_INTERVAL_MS);
    window.addEventListener("m1k:boost-completed", refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("m1k:boost-completed", refresh);
    };
  }, []);

  return data;
}

type FreshCounts = { total: number } & Partial<Pick<SiteData, "weekly" | "monthly" | "todayCount" | "boosted" | "daily">>;

function mergeCounts(prev: SiteData, fresh: FreshCounts): SiteData {
  const next = {
    total: fresh.total,
    weekly: fresh.weekly ?? prev.weekly,
    monthly: fresh.monthly ?? prev.monthly,
    todayCount: fresh.todayCount ?? prev.todayCount,
    boosted: fresh.boosted ?? prev.boosted,
  };
  const unchanged =
    prev.total === next.total &&
    prev.weekly === next.weekly &&
    prev.monthly === next.monthly &&
    prev.todayCount === next.todayCount &&
    prev.boosted === next.boosted;
  if (unchanged) return prev;
  return { ...prev, ...next, daily: fresh.daily ?? prev.daily };
}

export function DashboardView({ data: initialData, host, isOwner = false, isSignedIn = false, owner }: DashboardViewProps) {
  const data = useLiveCounts(initialData);
  const [showBadgeEditor, setShowBadgeEditor] = useState(false);

  const hasData = data.total > 0;

  // kit 쓰는 사이트면 코드 규모·절약 섹션 노출 (서버가 Redis 1h 캐시라 부담 없음)
  const { data: kitStats } = useFetch<KitStatsPayload>("/api/sites/kit-stats", {
    staleTime: 5 * 60 * 1000,
  });
  const kitSite = kitStats?.stats?.[data.slug];

  return (
    <AccentProvider initialAccent={(data.color as AccentHex) ?? undefined}>
      <Watermark sponsor={data.url ? { name: data.title ?? data.slug, url: data.url } : undefined}>
        <AppShell>
          <DashboardHeader url={data.url} />

          <div className="flex-1 overflow-y-auto">
            <SiteHero data={data} owner={owner} />

            {isOwner && !data.verified && (
              <BadgeEditor slug={data.slug} host={host} pending savedStyle={data.badgeStyle} savedColor={data.badgeColor} />
            )}

            {(hasData || data.verified) && (
              <Section className="py-3">
                <BoostButton
                  slug={data.slug}
                  siteName={data.ogTitle || data.title || data.slug}
                  siteDescription={data.ogDescription}
                  siteFaviconUrl={data.faviconUrl}
                  siteColor={data.color}
                  isSignedIn={isSignedIn}
                  totalBoosted={data.boosted}
                />
              </Section>
            )}

            {hasData && <StatsSections data={data} hasCode={!!kitSite} />}

            {kitSite && (
              <>
                <Divider />
                <div id="sec-code">
                  <Section className="py-5">
                    <KitCodeSection s={kitSite} latest={kitStats?.latestKitVersion ?? null} />
                  </Section>
                </div>
              </>
            )}

            {isOwner && (
              <OwnerSection
                data={data}
                host={host}
                showBadgeEditor={showBadgeEditor}
                onToggleEditor={() => setShowBadgeEditor((v) => !v)}
              />
            )}
          </div>
        </AppShell>
      </Watermark>
    </AccentProvider>
  );
}
