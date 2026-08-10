"use client";

import { SectionHeader } from "@m1kapp/kit";
import { compactNumber } from "@/lib/format";
import { leagueOf } from "@/lib/league";
import type { RecentSite } from "@/lib/types";
import { TypewriterHero, FAQSection } from "./home-tab-parts";
import { LeagueBoard } from "./league-board";
import { NewArrivals } from "./new-arrivals";

export function HomeTab({
  bgColor,
  recentSites,
  selfSlug,
  onStart,
  onBrowseApps,
}: {
  bgColor: string;
  recentSites: RecentSite[];
  selfSlug: string | null;
  onStart: () => void;
  onBrowseApps: () => void;
}) {
  // 통계도 리그와 같은 기준(주인 있는 사이트)으로 센다 — 리그엔 10개인데 위에선 12라고 하면 어긋난다
  const owned = recentSites.filter((s) => s.userId);
  const graduated = owned.filter((s) => leagueOf(s.total).rank > 0).length;
  const todayTotal = owned.reduce((sum, s) => sum + (s.today ?? 0), 0);

  return (
    <>
      {/* 싸이월드 방문자 카운터 — 최상단 얇은 바 */}
      {selfSlug && (
        <div className="w-full flex justify-center py-2">
          <a href={`/${selfSlug}`} target="_blank" rel="noopener noreferrer" className="block h-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/badge/${selfSlug}.svg`} alt="badge" className="dark:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/badge/${selfSlug}-dark.svg`} alt="badge" className="hidden dark:block" />
          </a>
        </div>
      )}

      {/* 히어로 */}
      <div className="px-4 pt-6 pb-7 text-center">
        <h1 className="text-5xl font-black tracking-tighter mb-1" style={{ color: bgColor }}>
          m1k
        </h1>
        <p className="text-xs text-zinc-400 mb-6">make 1k, m1k !</p>

        <div className="mb-6">
          <p className="text-lg text-zinc-400 dark:text-zinc-500 min-h-7 mb-4">
            <TypewriterHero bgColor={bgColor} />
          </p>
          <p className="text-xl font-black tracking-tight leading-snug text-zinc-900 dark:text-white">
            방문자 1,000명이 목표라면
          </p>
          <p className="text-xl font-black tracking-tight leading-snug" style={{ color: bgColor }}>
            방문자 트래커부터 달아보세요
          </p>
        </div>

        {/* 지금 이 순간의 판 — 숫자를 자랑하는 게 아니라 "돌아가고 있다"를 보여준다 */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          <Stat label="사이트" value={compactNumber(owned.length)} bgColor={bgColor} />
          <Stat label="오늘 방문" value={compactNumber(todayTotal)} bgColor={bgColor} />
          <Stat label="1K 돌파" value={compactNumber(graduated)} bgColor={bgColor} />
        </div>

        <button
          onClick={onStart}
          className="w-full h-12 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] mb-3"
          style={{ backgroundColor: bgColor }}
        >
          시작하기
        </button>

        <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400">
          <span>📝 사이트 등록</span>
          <span className="text-zinc-200">→</span>
          <span>🏷️ 트래커 심기</span>
          <span className="text-zinc-200">→</span>
          <span>🚀 함께 성장</span>
        </div>
      </div>

      {/* 리그 — 1K를 넘긴 사이트는 다음 리그로 올라간다 */}
      {recentSites.length > 0 && (
        <div className="px-4 pb-2">
          <SectionHeader>리그</SectionHeader>
          <p className="-mt-1 mb-3 text-[11px] text-zinc-400">
            1K를 넘기면 10K, 100K, 1M으로 올라갑니다. 퍼센트는 다음 목표까지의 진행률이에요.
          </p>
          <LeagueBoard sites={recentSites} bgColor={bgColor} onMore={onBrowseApps} />
        </div>
      )}

      {/* 새로 등록된 앱 — 누적 순 목록에선 늘 아래로 밀리는 자리 */}
      {recentSites.length > 0 && (
        <div className="px-4 pt-6">
          <SectionHeader>새로 등록된 앱</SectionHeader>
          <p className="-mt-1 mb-3 text-[11px] text-zinc-400">방금 합류한 사이드 프로젝트예요.</p>
          <NewArrivals sites={recentSites} bgColor={bgColor} />
        </div>
      )}

      {/* FAQ */}
      <div className="px-4 pt-8 pb-8">
        <SectionHeader>자주 묻는 질문</SectionHeader>
        <FAQSection />
      </div>
    </>
  );
}

function Stat({ label, value, bgColor }: { label: string; value: string; bgColor: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 py-2">
      <p className="text-lg font-black tabular-nums leading-tight" style={{ color: bgColor }}>
        {value}
      </p>
      <p className="text-[10px] text-zinc-400">{label}</p>
    </div>
  );
}
