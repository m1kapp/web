"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { GrassMap, Watermark, AppShell, Section, Divider } from "@m1kapp/kit";
import { AccentProvider, useAccent, type AccentHex } from "@/lib/theme-context";
import Link from "next/link";
import { SiteHero, CumulativeCurve } from "./site-hero";
import { OverviewInsights, CoachSection } from "./overview-insights";
import { BoostButton } from "./boost-button";
import { RefreshOgButton, DeleteSiteButton } from "./dashboard-settings";
import { BadgeEditor } from "./badge-editor";

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

  return (
    <AccentProvider initialAccent={(data.color as AccentHex) ?? undefined}>
      <Watermark sponsor={data.url ? { name: data.title ?? data.slug, url: data.url } : undefined}>
        <AppShell>
          <DashboardHeader url={data.url} />

          <div className="flex-1 overflow-y-auto">
            <SiteHero data={data} owner={owner} />

            {isOwner && (
              <Section className="pt-1 pb-3">
                <VerifiedStatus
                  verified={data.verified}
                  showEditor={showBadgeEditor}
                  onToggleEditor={() => setShowBadgeEditor((v) => !v)}
                />
              </Section>
            )}

            {isOwner && !data.verified && (
              <BadgeEditor slug={data.slug} host={host} pending savedStyle={data.badgeStyle} savedColor={data.badgeColor} />
            )}

            {isOwner && data.verified && showBadgeEditor && (
              <>
                <BadgeEditor slug={data.slug} host={host} savedStyle={data.badgeStyle} savedColor={data.badgeColor} />
                <Divider />
              </>
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
                <SectionNav hasCoach={data.daily.length >= 3} data={data} />

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

            {isOwner && (
              <>
                <Divider />
                <Section className="py-3">
                  <RefreshOgButton slug={data.slug} />
                  <DeleteSiteButton slug={data.slug} />
                </Section>
              </>
            )}
          </div>
        </AppShell>
      </Watermark>
    </AccentProvider>
  );
}

function VerifiedStatus({ verified, showEditor, onToggleEditor }: {
  verified: boolean;
  showEditor: boolean;
  onToggleEditor: () => void;
}) {
  const { accent } = useAccent();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {verified ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            인증됨
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: accent, backgroundColor: `${accent}1a` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
            인증 대기중
          </span>
        )}
      </div>
      {verified && (
        <button
          onClick={onToggleEditor}
          className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
            showEditor
              ? "text-white"
              : "text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          }`}
          style={showEditor ? { backgroundColor: accent } : undefined}
        >
          {showEditor ? "닫기" : "뱃지 수정"}
        </button>
      )}
    </div>
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

function SectionNav({ hasCoach, data }: { hasCoach: boolean; data: SiteData }) {
  const { accent } = useAccent();
  const hasCountries  = data.countries.filter((c) => c.country).length > 0;
  const hasCities     = data.cities.length > 0;
  const hasHourly     = data.hourly.length > 0;
  const hasDevices    = data.devices.length > 0;
  const hasBrowsersOs = data.browsers.filter((b) => b.browser).length > 0 || data.os.filter((o) => o.os).length > 0;
  const hasReferers   = data.referers.length > 0;

  const tabs = [
    { id: "sec-coach",      label: "코치",     show: hasCoach },
    { id: "sec-cumulative", label: "누적",     show: true },
    { id: "sec-daily",      label: "데일리",   show: true },
    { id: "sec-country",    label: "국가",     show: hasCountries },
    { id: "sec-city",       label: "도시",     show: hasCities },
    { id: "sec-hourly",     label: "시간대",   show: hasHourly },
    { id: "sec-device",     label: "디바이스", show: hasDevices },
    { id: "sec-browser",    label: "브라우저", show: hasBrowsersOs },
    { id: "sec-referer",    label: "유입",     show: hasReferers },
  ].filter((t) => t.show);

  const navRef = useRef<HTMLDivElement>(null);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    const nav = navRef.current;
    if (!el || !nav) return;
    // overflow-y-auto 스크롤 컨테이너 찾기
    let container = nav.parentElement;
    while (container && getComputedStyle(container).overflowY !== "auto") {
      container = container.parentElement;
    }
    if (!container) return;
    const navH = nav.offsetHeight;
    const targetTop = el.offsetTop - container.offsetTop - navH;
    container.scrollTo({ top: targetTop, behavior: "smooth" });
  }, []);

  return (
    <div ref={navRef} className="sticky top-0 z-10 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800">
      <div className="flex gap-1 px-3 py-1.5 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => scrollTo(t.id)}
            className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
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

