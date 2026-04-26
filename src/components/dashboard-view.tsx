"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { GrassMap, Watermark, AppShell, Section, Divider } from "@m1kapp/kit";
import { AccentProvider, useAccent, type AccentHex } from "@/lib/theme-context";
import { AnalyticsSection } from "./ui-parts";
import { countryFlag, deviceIcon, browserIcon, osIcon, formatHour } from "@/lib/format";
import Link from "next/link";
import { SiteHero, CumulativeCurve } from "./site-hero";
import { OverviewInsights } from "./overview-insights";
import { BoostButton } from "./boost-button";
import { RefreshOgButton, DeleteSiteButton, PendingBanner, SettingsLoginPrompt } from "./dashboard-settings";

const POLL_INTERVAL_MS = 30_000;

type Tab = "overview" | "analytics" | "settings";

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
  const [tab, setTab] = useState<Tab>("overview");
  const scrollRef = useRef<HTMLDivElement>(null);

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

  function switchTab(next: Tab) {
    setTab(next);
    scrollRef.current?.scrollTo({ top: 0 });
  }

  return (
    <AccentProvider initialAccent={(data.color as AccentHex) ?? undefined}>
      <Watermark sponsor={data.url ? { name: data.title ?? data.slug, url: data.url } : undefined}>
        <AppShell>
          <DashboardHeader url={data.url} />

          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {tab === "overview" && (
              <>
                {/* 사이트 배너 */}
                <SiteHero data={data} owner={owner} />

                {/* stat 1: 부스트 보내기 + 내역 */}
                <Section className="pb-3">
                  <BoostButton
                    slug={data.slug}
                    siteName={data.ogTitle || data.title || data.slug}
                    siteDescription={data.ogDescription}
                    siteOgImage={data.ogImage}
                    siteColor={data.color}
                    isSignedIn={isSignedIn}
                    totalBoosted={data.boosted}
                  />
                </Section>

                <Divider />

                {/* stat 2: 누적 곡선 */}
                <Section className="pt-3 pb-0">
                  <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mb-2">방문자 누적</p>
                  <CumulativeCurveWithAccent daily={data.daily} total={data.total} todayCount={data.todayCount} />
                </Section>

                <Divider />

                {/* stat 3: 잔디 */}
                <Section className="pt-3 pb-4">
                  <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mb-2">방문자 데일리</p>
                  <GrassMapWithAccent daily={data.daily} />
                </Section>

                <Divider />

                {/* 인사이트 */}
                <Section className="pt-3 pb-6">
                  <OverviewInsights data={data} />
                </Section>
              </>
            )}

            {tab === "analytics" && (
              <Section className="space-y-5 py-5 pb-6">
                <AnalyticsSection
                  title="국가"
                  items={data.countries.map((c) => ({
                    label: `${countryFlag(c.country)} ${c.country || "알 수 없음"}`,
                    value: Number(c.count),
                  }))}
                />
                <AnalyticsSection
                  title="도시"
                  items={data.cities.map((c) => {
                    let city = c.city || "알 수 없음";
                    try { city = decodeURIComponent(city); } catch {}
                    return { label: `📍 ${city}`, value: Number(c.count) };
                  })}
                />
                <AnalyticsSection
                  title="디바이스"
                  items={data.devices.map((d) => ({
                    label: `${deviceIcon(d.device)} ${d.device}`,
                    value: Number(d.count),
                  }))}
                />
                <AnalyticsSection
                  title="브라우저"
                  items={data.browsers.map((b) => ({
                    label: `${browserIcon(b.browser)} ${b.browser || "알 수 없음"}`,
                    value: Number(b.count),
                  }))}
                />
                <AnalyticsSection
                  title="운영체제"
                  items={data.os.map((o) => ({
                    label: `${osIcon(o.os)} ${o.os || "알 수 없음"}`,
                    value: Number(o.count),
                  }))}
                />
                <AnalyticsSection
                  title="유입 경로"
                  items={data.referers.map((r) => {
                    if (!r.referer) return { label: "직접 접속", value: Number(r.count) };
                    return { label: r.referer || "/", value: Number(r.count) };
                  })}
                />
                <AnalyticsSection
                  title="활성 시간대"
                  items={data.hourly.map((h) => ({
                    label: `🕐 ${formatHour(h.hour)}`,
                    value: Number(h.count),
                  }))}
                />
              </Section>
            )}

            {tab === "settings" && (
              <>
                {isOwner ? (
                  <>
                    {!data.verified && (
                      <>
                        <PendingBanner slug={data.slug} host={host} />
                        <Divider />
                      </>
                    )}
                    <Section className="pb-2">
                      <RefreshOgButton slug={data.slug} />
                    </Section>
                    <Section className="pb-6">
                      <DeleteSiteButton slug={data.slug} />
                    </Section>
                  </>
                ) : (
                  <SettingsLoginPrompt isSignedIn={isSignedIn} />
                )}
              </>
            )}
          </div>

          <BottomTabBar tab={tab} onTabChange={switchTab} />
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

function DashboardHeader({ url }: { url: string | null }) {
  const { accent } = useAccent();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md h-14 shrink-0">
      <div className="flex items-center justify-between px-4 h-full">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 dark:text-zinc-400">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <Link href="/" className="text-xl font-black tracking-tighter" style={{ color: accent }}>
            m1k
          </Link>
        </div>

        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors px-3 py-1.5 rounded-full"
          >
            <span>사이트 보러가기</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </div>
    </header>
  );
}

function BottomTabBar({ tab, onTabChange }: { tab: Tab; onTabChange: (t: Tab) => void }) {
  const { accent } = useAccent();

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    {
      id: "overview",
      label: "개요",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      id: "analytics",
      label: "분석",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      id: "settings",
      label: "설정",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md">
      <div className="flex">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors"
              style={{ color: active ? accent : undefined }}
            >
              <span className={active ? "" : "text-zinc-400 dark:text-zinc-600"}>{t.icon}</span>
              <span className={`text-[10px] font-semibold ${active ? "" : "text-zinc-400 dark:text-zinc-600"}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
