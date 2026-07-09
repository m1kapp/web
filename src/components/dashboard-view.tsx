"use client";

import { useState, useEffect, useRef } from "react";
import { GrassMap, Watermark, AppShell, Section, Divider, useFetch } from "@m1kapp/kit";
import { AccentProvider, useAccent, type AccentHex } from "@/lib/theme-context";
import { SiteHero } from "./site-hero";
import { CumulativeCurve } from "./cumulative-curve";
import { OverviewInsights, CoachSection } from "./overview-insights";
import { BoostButton } from "./boost-button";
import { RefreshOgButton, DeleteSiteButton } from "./dashboard-settings";
import { BadgeEditor } from "./badge-editor";
import {
  DashboardHeader, SectionNav, VerifiedStatus, KitCodeSection,
  type KitStatsPayload,
} from "./dashboard-chrome";

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

export function DashboardView({ data: initialData, host, isOwner = false, isSignedIn = false, owner }: DashboardViewProps) {
  const [data, setData] = useState(initialData);
  const [showBadgeEditor, setShowBadgeEditor] = useState(false);

  const slugRef = useRef(data.slug);
  slugRef.current = data.slug;

  useEffect(() => {
    async function refresh() {
      try {
        const res = await fetch(`/api/sites/${slugRef.current}`);
        if (!res.ok) return;
        const fresh = await res.json();
        setData((prev) => {
          const next = {
            total: fresh.total,
            weekly: fresh.weekly ?? prev.weekly,
            monthly: fresh.monthly ?? prev.monthly,
            todayCount: fresh.todayCount ?? prev.todayCount,
            boosted: fresh.boosted ?? prev.boosted,
          };
          if (
            prev.total === next.total &&
            prev.weekly === next.weekly &&
            prev.monthly === next.monthly &&
            prev.todayCount === next.todayCount &&
            prev.boosted === next.boosted
          ) return prev;
          return { ...prev, ...next, daily: fresh.daily ?? prev.daily };
        });
      } catch (e) { console.error("[dashboard] poll failed:", e); }
    }

    const interval = setInterval(() => { if (!document.hidden) refresh(); }, POLL_INTERVAL_MS);
    window.addEventListener("m1k:boost-completed", refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("m1k:boost-completed", refresh);
    };
  }, []);

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

            {hasData && (
              <>
                {/* 섹션 탭 네비게이션 */}
                <SectionNav hasCoach={data.daily.length >= 3} data={data} hasCode={!!kitSite} />

                {data.daily.length >= 3 && (
                  <div id="sec-coach">
                    <Section className="py-5">
                      <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mb-2.5">1K 코치</p>
                      <CoachSection data={data} />
                    </Section>
                    <Divider />
                  </div>
                )}

                <div id="sec-cumulative">
                  <Section className="py-5">
                    <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mb-2">방문자 누적</p>
                    <CumulativeCurveWithAccent daily={data.daily} total={data.total} todayCount={data.todayCount} />
                  </Section>
                </div>

                <Divider />

                <div id="sec-daily">
                  <Section className="py-5">
                    <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mb-2">방문자 데일리</p>
                    <GrassMapWithAccent daily={data.daily} />
                  </Section>
                </div>

                <Divider />

                <Section className="py-3">
                  <OverviewInsights data={data} />
                </Section>
              </>
            )}

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
              <>
                <Divider />
                <Section className="py-4">
                  <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mb-3">관리</p>

                  <VerifiedStatus
                    verified={data.verified}
                    showEditor={showBadgeEditor}
                    onToggleEditor={() => setShowBadgeEditor((v) => !v)}
                    isOwner
                  />

                  {data.verified && showBadgeEditor && (
                    <div className="mt-3">
                      <BadgeEditor slug={data.slug} host={host} savedStyle={data.badgeStyle} savedColor={data.badgeColor} />
                    </div>
                  )}

                  <div className="mt-3 space-y-0">
                    <RefreshOgButton slug={data.slug} />
                    <DeleteSiteButton slug={data.slug} />
                  </div>
                </Section>
              </>
            )}
          </div>
        </AppShell>
      </Watermark>
    </AccentProvider>
  );
}
function CumulativeCurveWithAccent({ daily, total, todayCount }: { daily: { date: string; count: number }[]; total: number; todayCount: number }) {
  const { accent } = useAccent();
  return <CumulativeCurve daily={daily} total={total} todayCount={todayCount} accent={accent} />;
}

function GrassMapWithAccent({ daily }: { daily: { date: string; count: number }[] }) {
  const { accent, isDark } = useAccent();
  return <GrassMap data={daily} accent={accent} isDark={isDark} unit="명" />;
}
