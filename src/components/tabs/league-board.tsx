"use client";

import { compactNumber } from "@/lib/format";
import { groupByLeague, leagueOf } from "@/lib/league";
import { slugToColor } from "@/lib/site-color";
import { SiteThumbnail } from "@/components/site-preview-card";
import type { RecentSite } from "@/lib/types";

/**
 * 리그 보드 — 등록된 사이트를 1K / 10K / 100K / 1M 리그로 나눠 세운다.
 * 상위 리그가 위로 오고, 각 사이트는 자기 리그 안에서의 진행률을 막대로 보여준다.
 */
export function LeagueBoard({ sites, bgColor }: { sites: RecentSite[]; bgColor: string }) {
  const groups = groupByLeague(sites);

  return (
    <div className="space-y-6">
      {groups.map(({ league, sites: members }) => (
        <section key={league.label}>
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-sm font-black tracking-tight text-zinc-900 dark:text-white">
              {league.label} 리그
            </h3>
            <span className="text-[10px] text-zinc-400">
              {league.target ? `다음 목표 ${league.label}` : "최고 리그"} · {members.length}개
            </span>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/70 overflow-hidden">
            {members.map((site, i) => (
              <LeagueRow key={site.slug} site={site} rank={i + 1} bgColor={bgColor} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function LeagueRow({
  site,
  rank,
  bgColor,
}: {
  site: RecentSite;
  rank: number;
  bgColor: string;
}) {
  // 리그는 그룹이 같아도 진행률은 사이트마다 다르다 — 여기서 각자 계산한다
  const league = leagueOf(site.total);
  const name = site.ogTitle || site.title || site.slug;
  const color = site.color || slugToColor(site.slug);
  const percent = Math.round(league.progress * 100);
  // 리그 안에서 다시 0부터 — 100K 리그의 31,658은 10,000을 뺀 21,658부터 센다
  const gained = site.total - league.floor;

  return (
    <a href={`/${site.slug}`} className="block px-3 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
      <div className="flex items-center gap-2.5">
        <span className="w-4 shrink-0 text-[10px] font-bold tabular-nums text-zinc-300 dark:text-zinc-600">
          {rank}
        </span>

        <SiteThumbnail slug={site.slug} name={name} faviconUrl={site.faviconUrl} color={color} size="xs" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-zinc-800 dark:text-zinc-100" title={name}>
            {name}
          </p>
          <p className="mt-0.5 text-[9px] text-zinc-400 tabular-nums">
            누적 {compactNumber(site.total)}
            {site.today ? <span className="ml-1 text-emerald-500">+{compactNumber(site.today)}</span> : null}
          </p>
        </div>

        <div className="w-[92px] shrink-0">
          {league.target ? (
            <>
              <div className="flex items-baseline justify-between">
                <span className="text-[9px] tabular-nums text-zinc-400">{compactNumber(gained)}</span>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: bgColor }}>
                  {percent}%
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full transition-[width] duration-700 ease-out"
                  style={{ width: `${Math.max(percent, 2)}%`, backgroundColor: bgColor }}
                />
              </div>
            </>
          ) : (
            <span className="block text-right text-[10px] font-black tracking-tight" style={{ color: bgColor }}>
              1M 돌파 ✦
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
