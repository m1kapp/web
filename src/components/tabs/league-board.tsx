"use client";

import { useMemo, useState } from "react";
import { compactNumber } from "@/lib/format";
import { leagueOf, LEAGUE_TARGETS } from "@/lib/league";
import { slugToColor } from "@/lib/site-color";
import { SiteThumbnail } from "@/components/site-preview-card";
import type { RecentSite } from "@/lib/types";

const ALL = "all";

/**
 * 리그 보드 — 등록된 사이트를 1K / 10K / 100K / 1M 리그로 세운다.
 *
 * 리그마다 섹션을 쌓으면 화면이 길어지고, 사이트가 적은 리그는 한 줄짜리 섹션이 된다.
 * 그래서 리그는 우상단 필터로 두고 목록은 하나만 유지한다.
 */
export function LeagueBoard({ sites, bgColor }: { sites: RecentSite[]; bgColor: string }) {
  const [selected, setSelected] = useState<string>(ALL);

  const { chips, rows } = useMemo(() => {
    const ranked = [...sites].sort((a, b) => b.total - a.total);

    // 사이트가 없는 리그는 칩을 만들지 않는다 — 눌러도 빈 화면인 탭은 없느니만 못하다
    const counts = new Map<string, number>();
    for (const site of ranked) {
      const label = leagueOf(site.total).label;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    const order = [...LEAGUE_TARGETS.map((t) => leagueOf(t - 1).label), "1M+"];
    const present = order.filter((label) => counts.has(label));

    return {
      chips: [{ id: ALL, label: "전체", count: ranked.length }].concat(
        present.map((label) => ({ id: label, label, count: counts.get(label)! })),
      ),
      rows: selected === ALL ? ranked : ranked.filter((s) => leagueOf(s.total).label === selected),
    };
  }, [sites, selected]);

  return (
    <>
      <div className="mb-3 flex gap-1.5 overflow-x-auto scrollbar-hide">
        {chips.map((chip) => {
          const active = chip.id === selected;
          return (
            <button
              key={chip.id}
              onClick={() => setSelected(chip.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${
                active
                  ? "text-white"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
              style={active ? { backgroundColor: bgColor } : undefined}
            >
              {chip.id === ALL ? chip.label : `${chip.label} 리그`}
              <span className={active ? "ml-1 opacity-70" : "ml-1 text-zinc-400"}>{chip.count}</span>
            </button>
          );
        })}
      </div>

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
        {rows.map((site, i) => (
          <LeagueRow key={site.slug} site={site} rank={i + 1} bgColor={bgColor} />
        ))}
      </div>
    </>
  );
}

function LeagueRow({ site, rank, bgColor }: { site: RecentSite; rank: number; bgColor: string }) {
  const league = leagueOf(site.total);
  const name = site.ogTitle || site.title || site.slug;
  const color = site.color || slugToColor(site.slug);
  const percent = Math.round(league.progress * 100);

  return (
    <a
      href={`/${site.slug}`}
      className="flex items-center gap-2.5 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
    >
      <span className="w-5 shrink-0 text-center text-[11px] font-black tabular-nums text-zinc-300 dark:text-zinc-600">
        {String(rank).padStart(2, "0")}
      </span>

      <SiteThumbnail slug={site.slug} name={name} faviconUrl={site.faviconUrl} color={color} size="xs" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold text-zinc-800 dark:text-zinc-100" title={name}>
          {name}
        </p>
        <p className="mt-0.5 truncate text-[9px] tabular-nums text-zinc-400">
          {league.target ? `${league.label} 리그` : "1M 돌파"} · {compactNumber(site.total)}
          {site.today ? <span className="ml-1 text-emerald-500">+{compactNumber(site.today)}</span> : null}
        </p>
      </div>

      <div className="w-[76px] shrink-0 text-right">
        {league.target ? (
          <>
            <span className="text-[13px] font-black tabular-nums" style={{ color: bgColor }}>
              {percent}%
            </span>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${Math.max(percent, 2)}%`, backgroundColor: bgColor }}
              />
            </div>
          </>
        ) : (
          <span className="text-[12px] font-black tracking-tight" style={{ color: bgColor }}>
            ✦ MAX
          </span>
        )}
      </div>
    </a>
  );
}
