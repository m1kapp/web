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

function compact(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/** 코드줄 스택바 — F/B/공용 비율, 폭은 전체 최대 대비 */
function CodeBar({ s, max }: { s: SiteKitStats; max: number }) {
  const total = s.codeLines ?? 0;
  if (!total) return <span className="text-zinc-300 dark:text-zinc-600">—</span>;
  const width = Math.max((total / max) * 100, 6);
  const b = s.breakdown;
  const segs = b
    ? [
        { key: "frontend", v: b.frontend.codeLines, color: BAR_COLORS.frontend },
        { key: "backend", v: b.backend.codeLines, color: BAR_COLORS.backend },
        { key: "shared", v: b.shared.codeLines, color: BAR_COLORS.shared },
      ]
    : [{ key: "all", v: total, color: BAR_COLORS.shared }];
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="h-2 rounded-full overflow-hidden flex shrink-0" style={{ width: `${width * 0.56}px` }}>
        {segs.map((seg) => (
          <div key={seg.key} style={{ width: `${(seg.v / total) * 100}%`, backgroundColor: seg.color }} />
        ))}
      </div>
      <span className="tabular-nums text-zinc-500 dark:text-zinc-400">{compact(total)}</span>
    </div>
  );
}

/** dev 모드 비교 테이블 — 사이트 × (버전·코드·kit%·청결) */
export function DevTable({ sites, stats, latest }: {
  sites: RecentSite[];
  stats: Record<string, SiteKitStats> | undefined;
  latest: string | null;
}) {
  const withStats = sites.map((site) => ({ site, s: stats?.[site.slug] }));
  const maxLines = Math.max(...withStats.map(({ s }) => s?.codeLines ?? 0), 1);

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full text-[11px] font-mono">
        <thead>
          <tr className="text-[10px] text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">
            <th className="text-left font-medium py-1.5 pr-2">사이트</th>
            <th className="text-left font-medium py-1.5 pr-2">버전</th>
            <th className="text-left font-medium py-1.5 pr-2">
              코드 <span style={{ color: BAR_COLORS.frontend }}>F</span>·<span style={{ color: BAR_COLORS.backend }}>B</span>·<span style={{ color: BAR_COLORS.shared }}>공</span>
            </th>
            <th className="text-right font-medium py-1.5 pr-2">kit</th>
            <th className="text-right font-medium py-1.5">청결</th>
          </tr>
        </thead>
        <tbody>
          {withStats.map(({ site, s }) => {
            const name = site.ogTitle || site.title || site.slug;
            const behind = !!(s && latest && s.kitVersion !== latest);
            return (
              <tr key={site.slug} className="border-b border-zinc-50 dark:border-zinc-900">
                <td className="py-2 pr-2 max-w-[110px]">
                  <a href={`/${site.slug}`} className="flex items-center gap-1.5 min-w-0">
                    {site.faviconUrl
                      ? // eslint-disable-next-line @next/next/no-img-element
                        <img src={site.faviconUrl} alt="" width={14} height={14} className="rounded shrink-0" />
                      : <span className="w-3.5 h-3.5 rounded bg-zinc-200 dark:bg-zinc-700 shrink-0" />}
                    <span className="truncate text-zinc-700 dark:text-zinc-200 font-sans font-medium">{name}</span>
                  </a>
                </td>
                {s ? (
                  <>
                    <td className={`py-2 pr-2 tabular-nums ${behind ? "text-amber-500 font-semibold" : "text-emerald-600 dark:text-emerald-500"}`}>
                      {s.kitVersion}
                    </td>
                    <td className="py-2 pr-2"><CodeBar s={s} max={maxLines} /></td>
                    <td className="py-2 pr-2 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                      {s.savedPercent != null ? `${s.savedPercent}%` : "—"}
                    </td>
                    <td className={`py-2 text-right font-bold ${s.quality ? GRADE_COLORS[s.quality.grade] ?? "" : ""}`}>
                      {s.quality ? `${s.quality.grade}${s.quality.score}` : "—"}
                    </td>
                  </>
                ) : (
                  <td colSpan={4} className="py-2 text-zinc-300 dark:text-zinc-600">kit-stats 없음</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
