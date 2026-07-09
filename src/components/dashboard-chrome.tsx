"use client";

import { useRef, useCallback } from "react";
import Link from "next/link";
import { useAccent } from "@/lib/theme-context";
import type { SiteData } from "./dashboard-view";

export { KitCodeSection, type KitSiteStats, type KitStatsPayload } from "./kit-code-section";

// ─── 인증 상태 뱃지 ──────────────────────────────────────────────────────────

export function VerifiedStatus({ verified, showEditor, onToggleEditor, isOwner = false }: {
  verified: boolean;
  showEditor: boolean;
  onToggleEditor: () => void;
  isOwner?: boolean;
}) {
  const { accent } = useAccent();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        {verified ? (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border"
            style={{ color: accent, borderColor: `${accent}33`, backgroundColor: `${accent}0a` }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 5.8L21 9l-4.5 4.4 1.1 6.3L12 16.8l-5.6 2.9 1.1-6.3L3 9l6.1-1.2z"/></svg>
            인증됨
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ color: accent, backgroundColor: `${accent}1a` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accent }} />
            인증 대기중
          </span>
        )}
      </div>
      {verified && isOwner && (
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

// ─── 섹션 탭 네비게이션 ──────────────────────────────────────────────────────

export function SectionNav({ hasCoach, data, hasCode }: { hasCoach: boolean; data: SiteData; hasCode: boolean }) {
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
    { id: "sec-code",       label: "코드",     show: hasCode },
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

// ─── 상단 헤더 ───────────────────────────────────────────────────────────────

export function DashboardHeader({ url }: { url: string | null }) {
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
