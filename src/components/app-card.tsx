"use client";

import { relativeTime } from "@m1kapp/kit";
import { compactNumber } from "@/lib/format";
import { leagueOf } from "@/lib/league";
import { slugToColor } from "@/lib/site-color";
import { SiteThumbnail } from "@/components/site-preview-card";
import type { RecentSite } from "@/lib/types";

/**
 * 앱스토어식 사이트 카드 — 홈의 "새로 등록된 앱"과 앱 탭 목록이 같이 쓴다.
 *
 * 카드 본문과 "열기"는 목적지가 다르다. 본문은 m1k 안의 사이트 상세(방문 추이),
 * 열기는 그 사이트 자체다. 남의 사이트라 새 탭으로 연다.
 */
export function AppCard({
  site,
  bgColor,
  /** 등록 시각을 보여줄지 — "새로 등록된 앱"에서만 의미가 있다 */
  showAge = false,
}: {
  site: RecentSite;
  bgColor: string;
  showAge?: boolean;
}) {
  const name = site.ogTitle || site.title || site.slug;
  const desc = site.ogDescription || site.url || site.slug;
  const league = leagueOf(site.total);
  const percent = Math.round(league.progress * 100);

  const created = site.createdAt ? new Date(site.createdAt).getTime() : 0;
  // 사흘 안에 올라온 건 따로 표시한다 — "새로 등록"이라 해놓고 한 달 전 것만 있으면 말이 안 된다
  const isFresh = showAge && created > 0 && Date.now() - created < 3 * 24 * 60 * 60 * 1000;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40">
      <a href={`/${site.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
        <SiteThumbnail
          slug={site.slug}
          name={name}
          faviconUrl={site.faviconUrl}
          color={site.color || slugToColor(site.slug)}
          size="lg"
        />

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-bold text-zinc-900 dark:text-white" title={name}>
              {name}
            </span>
            {isFresh && (
              <span
                className="shrink-0 rounded px-1 py-px text-[8px] font-black tracking-wider text-white"
                style={{ backgroundColor: bgColor }}
              >
                NEW
              </span>
            )}
          </span>

          <span className="mt-0.5 line-clamp-2 block text-[10px] leading-snug text-zinc-400" title={desc}>
            {desc}
          </span>

          <span className="mt-1 flex items-center gap-1.5 text-[9px] tabular-nums text-zinc-400">
            <span className="font-bold" style={{ color: bgColor }}>
              {league.target ? `${league.label} ${percent}%` : "1M 돌파 ✦"}
            </span>
            <span>·</span>
            <span>{compactNumber(site.total)}</span>
            {site.today ? <span className="text-emerald-500">+{compactNumber(site.today)}</span> : null}
            {showAge && site.createdAt && (
              <>
                <span>·</span>
                <span>{relativeTime(site.createdAt)} 등록</span>
              </>
            )}
          </span>
        </span>
      </a>

      {site.url ? (
        <a
          href={site.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold text-white"
          style={{ backgroundColor: bgColor }}
        >
          열기
        </a>
      ) : null}
    </div>
  );
}
