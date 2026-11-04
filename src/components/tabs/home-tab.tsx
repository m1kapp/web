"use client";

import { SectionHeader } from "@m1kapp/kit";
import { compactNumber } from "@/lib/format";
import { leagueOf } from "@/lib/league";
import { slugToColor } from "@/lib/site-color";
import { SiteThumbnail } from "@/components/site-preview-card";
import type { RecentSite } from "@/lib/types";
import { FAQSection } from "./home-tab-parts";
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
  // 통계도 차트와 같은 기준(주인 있는 사이트)으로 센다 — 차트엔 10개인데 위에선 12라고 하면 어긋난다
  const owned = recentSites.filter((s) => s.userId);
  const graduated = owned.filter((s) => leagueOf(s.total).rank > 0).length;
  // ponytail: API 상위 30개 합계다. 사이트가 30개를 넘으면 전용 집계 API로 바꾼다
  const todayTotal = owned.reduce((sum, s) => sum + (s.today ?? 0), 0);
  const allTotal = owned.reduce((sum, s) => sum + s.total, 0);
  const trending = owned
    .filter((s) => s.today)
    .sort((a, b) => (b.today ?? 0) - (a.today ?? 0))
    .slice(0, 10);
  // 로딩 중 0을 보여주면 죽은 서비스처럼 보인다
  const loading = recentSites.length === 0;

  return (
    <>
      <div className="flex items-end justify-between gap-3 px-4 pt-5 pb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">오늘의 앱</h1>
          <p className="mt-0.5 text-[12px] text-zinc-400">설치 없이 바로 여는 웹앱만 모았어요</p>
        </div>
        <button
          onClick={onStart}
          className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold text-white"
          style={{ backgroundColor: bgColor }}
        >
          + 내 앱 등록
        </button>
      </div>

      {/* 스토어 전체의 오늘/누적 방문 — 트래커가 돌아간다는 걸 가장 먼저 보여준다 */}
      <div className="px-4 pb-6">
        <div className="rounded-2xl p-4 text-white" style={{ backgroundColor: bgColor }}>
          <div className="grid grid-cols-2 divide-x divide-white/20">
            <Counter label="TODAY" value={loading ? "–" : todayTotal.toLocaleString("ko-KR")} />
            <Counter label="TOTAL" value={loading ? "–" : allTotal.toLocaleString("ko-KR")} />
          </div>
          <p className="mt-3 text-center text-[11px] text-white/60">
            {loading ? " " : `앱 ${compactNumber(owned.length)}개 · 1K 돌파 ${compactNumber(graduated)}개`}
          </p>
        </div>
      </div>

      {trending.length > 0 && (
        <div className="pb-6">
          <div className="px-4">
            <SectionHeader>오늘 뜨는 앱</SectionHeader>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 scrollbar-hide">
            {trending.map((site) => (
              <TrendingTile key={site.slug} site={site} />
            ))}
          </div>
        </div>
      )}

      {recentSites.length > 0 && (
        <div className="px-4 pb-2">
          <SectionHeader>인기 차트</SectionHeader>
          <LeagueBoard sites={recentSites} bgColor={bgColor} onMore={onBrowseApps} />
        </div>
      )}

      {/* 새로 등록된 앱 — 누적 순 목록에선 늘 아래로 밀리는 자리 */}
      {recentSites.length > 0 && (
        <div className="px-4 pt-6">
          <SectionHeader>새로 등록된 앱</SectionHeader>
          <NewArrivals sites={recentSites} bgColor={bgColor} />
        </div>
      )}

      {/* 메이커용 안내는 앱을 다 본 뒤에 — 스토어의 첫 화면은 앱이 차지한다 */}
      <div className="px-4 pt-8">
        <div className="rounded-2xl border border-zinc-200 p-4 text-center dark:border-zinc-800">
          <p className="text-[15px] font-black tracking-tight text-zinc-900 dark:text-white">
            내 앱도 첫 방문자 1,000명까지
          </p>
          <p className="mt-1 text-[11px] text-zinc-400">앱을 등록하고 방문자 트래커를 달면 여기에 올라와요.</p>
          {selfSlug && (
            <a href={`/${selfSlug}`} className="mt-3 flex h-10 justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/badge/${selfSlug}.svg`} alt="m1k 방문자 트래커 예시" className="dark:hidden" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/badge/${selfSlug}-dark.svg`} alt="m1k 방문자 트래커 예시" className="hidden dark:block" />
            </a>
          )}
          <button
            onClick={onStart}
            className="mt-3 h-11 w-full rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98]"
            style={{ backgroundColor: bgColor }}
          >
            시작하기
          </button>
        </div>
      </div>

      <div className="px-4 pt-8 pb-8">
        <SectionHeader>자주 묻는 질문</SectionHeader>
        <FAQSection />
      </div>
    </>
  );
}

function Counter({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 text-center">
      <p className="text-[11px] font-bold tracking-widest text-white/60">{label}</p>
      <p className="mt-0.5 truncate text-[28px] font-black leading-tight tabular-nums">{value}</p>
    </div>
  );
}

function TrendingTile({ site }: { site: RecentSite }) {
  const name = site.ogTitle || site.title || site.slug;
  return (
    <a href={`/${site.slug}`} className="w-[76px] shrink-0">
      <SiteThumbnail
        slug={site.slug}
        name={name}
        faviconUrl={site.faviconUrl}
        color={site.color || slugToColor(site.slug)}
        size="lg"
      />
      {/* 이름이 한 줄이어도 두 줄 높이를 잡아 아래 숫자 라인을 맞춘다 */}
      <span className="mt-1.5 line-clamp-2 min-h-[2.5em] text-[11px] font-semibold leading-tight text-zinc-800 dark:text-zinc-100" title={name}>
        {name}
      </span>
      <span className="mt-0.5 block text-[11px] font-black tabular-nums text-emerald-500">
        +{compactNumber(site.today ?? 0)}
      </span>
    </a>
  );
}
