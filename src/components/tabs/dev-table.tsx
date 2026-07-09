"use client";

import type { RecentSite } from "@/lib/types";
import type { SiteKitStats } from "./store-tab";

const GRADE_COLORS: Record<string, string> = {
  "A+": "text-emerald-500",
  A: "text-green-500",
  B: "text-lime-600 dark:text-lime-500",
  C: "text-amber-500",
  D: "text-red-500",
};

// 스택바 색 — 프론트/백엔드/공용
const BAR_COLORS = { frontend: "#3b82f6", backend: "#f97316", shared: "#a1a1aa" } as const;

/** 행 하단 얇은 스택바 — 코드 구성(F/B/공) × 규모(전체 최대 대비 폭) */
function CodeBar({ s, max }: { s: SiteKitStats; max: number }) {
  const total = s.codeLines ?? 0;
  if (!total) return null;
  const width = Math.max((total / max) * 100, 5);
  const b = s.breakdown;
  const segs = b
    ? [
        { key: "f", v: b.frontend.codeLines, color: BAR_COLORS.frontend },
        { key: "b", v: b.backend.codeLines, color: BAR_COLORS.backend },
        { key: "s", v: b.shared.codeLines, color: BAR_COLORS.shared },
      ]
    : [{ key: "all", v: total, color: BAR_COLORS.shared }];
  return (
    <div className="h-[3px] rounded-full overflow-hidden flex mt-1.5" style={{ width: `${width}%` }}>
      {segs.map((seg) => (
        <div key={seg.key} style={{ width: `${(seg.v / total) * 100}%`, backgroundColor: seg.color }} />
      ))}
    </div>
  );
}

function SiteLogo({ site }: { site: RecentSite }) {
  if (site.faviconUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={site.faviconUrl} alt="" width={28} height={28} className="rounded-lg shrink-0" />;
  }
  return <span className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-700 shrink-0" />;
}

/** dev 모드 비교 뷰 — 2줄 레이아웃:
 *  [로고] 이름      파일수   kit%
 *         버전      줄수     code health
 *  + 하단 F/B/공 스택바 (폭 = 규모) */
export function DevTable({ sites, stats, latest }: {
  sites: RecentSite[];
  stats: Record<string, SiteKitStats> | undefined;
  latest: string | null;
}) {
  const withStats = sites.map((site) => ({ site, s: stats?.[site.slug] }));
  const maxLines = Math.max(...withStats.map(({ s }) => s?.codeLines ?? 0), 1);

  return (
    <div>
      {/* 범례 */}
      <div className="flex justify-end gap-2 text-[9px] font-mono text-zinc-400 dark:text-zinc-500 mb-1">
        <span><span style={{ color: BAR_COLORS.frontend }}>■</span> front</span>
        <span><span style={{ color: BAR_COLORS.backend }}>■</span> back</span>
        <span><span style={{ color: BAR_COLORS.shared }}>■</span> shared</span>
      </div>

      <div className="space-y-0">
        {withStats.map(({ site, s }) => {
          const name = site.ogTitle || site.title || site.slug;
          const behind = !!(s && latest && s.kitVersion !== latest);
          return (
            <a
              key={site.slug}
              href={`/${site.slug}`}
              className="flex gap-3 py-2.5 border-b border-zinc-50 dark:border-zinc-900"
            >
              <SiteLogo site={site} />
              <div className="flex-1 min-w-0 font-mono text-[11px]">
                {/* 1줄: 이름 · 파일수 · kit% */}
                <div className="flex items-baseline gap-3">
                  <span className="flex-1 min-w-0 truncate font-sans text-[13px] font-semibold text-zinc-800 dark:text-zinc-100">
                    {name}
                  </span>
                  {s ? (
                    <>
                      <span className="tabular-nums text-zinc-400 dark:text-zinc-500 shrink-0 w-14 text-right">
                        {s.files != null ? `${s.files}파일` : "—"}
                      </span>
                      <span className="tabular-nums text-zinc-500 dark:text-zinc-400 shrink-0 w-14 text-right">
                        {s.savedPercent != null ? `kit ${s.savedPercent}%` : "—"}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-zinc-300 dark:text-zinc-600 shrink-0">kit-stats 없음</span>
                  )}
                </div>
                {/* 2줄: 버전 · 줄수 · code health */}
                {s && (
                  <div className="flex items-baseline gap-3 mt-0.5">
                    <span className={`flex-1 min-w-0 truncate tabular-nums ${behind ? "text-amber-500 font-semibold" : "text-emerald-600 dark:text-emerald-500"}`}>
                      v{s.kitVersion}{behind && ` → ${latest}`}
                    </span>
                    <span className="tabular-nums text-zinc-400 dark:text-zinc-500 shrink-0 w-14 text-right">
                      {s.codeLines != null ? `${s.codeLines.toLocaleString()}줄` : "—"}
                    </span>
                    <span className={`tabular-nums font-bold shrink-0 w-14 text-right ${s.quality ? GRADE_COLORS[s.quality.grade] ?? "" : "text-zinc-300"}`}>
                      {s.quality ? `${s.quality.grade} ${s.quality.score}` : "—"}
                    </span>
                  </div>
                )}
                {s && <CodeBar s={s} max={maxLines} />}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
