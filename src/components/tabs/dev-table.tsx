"use client";

import { useState } from "react";
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

/** 파비콘 — 로드 실패 시 이니셜 원으로 폴백 (깨진 이미지 아이콘 방지) */
function SiteLogo({ site }: { site: RecentSite }) {
  const [failed, setFailed] = useState(false);
  const name = site.ogTitle || site.title || site.slug;
  if (!site.faviconUrl || failed) {
    return (
      <span className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-700 shrink-0 flex items-center justify-center text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
        {name[0]?.toUpperCase()}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={site.faviconUrl}
      alt=""
      width={28}
      height={28}
      className="rounded-lg shrink-0 w-7 h-7 object-cover"
      onError={() => setFailed(true)}
    />
  );
}

/** 코드 구성 스택바 — F/B/공 비율, 폭 고정(60px) */
function CodeBar({ s }: { s: SiteKitStats }) {
  const total = s.codeLines ?? 0;
  if (!total) return <span className="text-zinc-300 dark:text-zinc-600">—</span>;
  const b = s.breakdown;
  const segs = b
    ? [
        { key: "f", v: b.frontend.codeLines, color: BAR_COLORS.frontend },
        { key: "b", v: b.backend.codeLines, color: BAR_COLORS.backend },
        { key: "s", v: b.shared.codeLines, color: BAR_COLORS.shared },
      ]
    : [{ key: "all", v: total, color: BAR_COLORS.shared }];
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-2 rounded-full overflow-hidden flex shrink-0 bg-zinc-100 dark:bg-zinc-800">
        {segs.map((seg) => (
          <div key={seg.key} style={{ width: `${(seg.v / total) * 100}%`, backgroundColor: seg.color }} />
        ))}
      </div>
      <span className="tabular-nums whitespace-nowrap">{total.toLocaleString()}</span>
    </div>
  );
}

/** dev 모드 비교 테이블 — 고정폭 열 + 가로 스크롤 (좁은 화면에서도 안 찌그러짐) */
export function DevTable({ sites, stats, latest }: {
  sites: RecentSite[];
  stats: Record<string, SiteKitStats> | undefined;
  latest: string | null;
}) {
  const withStats = sites.map((site) => ({ site, s: stats?.[site.slug] }));

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="text-[11px] font-mono border-collapse" style={{ width: "420px", tableLayout: "fixed" }}>
        <thead>
          <tr className="text-[10px] text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">
            <th className="text-left font-medium py-1.5 pr-3 sticky left-0 bg-white dark:bg-zinc-950" style={{ width: "120px" }}>사이트</th>
            <th className="text-left font-medium py-1.5 pr-3" style={{ width: "50px" }}>파일</th>
            <th className="text-left font-medium py-1.5 pr-3" style={{ width: "110px" }}>
              코드 <span style={{ color: BAR_COLORS.frontend }}>■</span><span style={{ color: BAR_COLORS.backend }}>■</span><span style={{ color: BAR_COLORS.shared }}>■</span>
            </th>
            <th className="text-right font-medium py-1.5 pr-3" style={{ width: "45px" }}>kit</th>
            <th className="text-right font-medium py-1.5" style={{ width: "60px" }}>health</th>
          </tr>
        </thead>
        <tbody>
          {withStats.map(({ site, s }) => {
            const name = site.ogTitle || site.title || site.slug;
            const behind = !!(s && latest && s.kitVersion !== latest);
            return (
              <tr key={site.slug} className="border-b border-zinc-50 dark:border-zinc-900">
                <td className="py-2 pr-3 sticky left-0 bg-white dark:bg-zinc-950 overflow-hidden">
                  <a href={`/${site.slug}`} className="flex items-center gap-2 min-w-0 overflow-hidden">
                    <SiteLogo site={site} />
                    <span className="min-w-0">
                      <span className="block truncate font-sans font-medium text-zinc-700 dark:text-zinc-200">{name}</span>
                      {s && (
                        <span className={`block text-[9px] tabular-nums whitespace-nowrap ${behind ? "text-amber-500 font-semibold" : "text-emerald-600 dark:text-emerald-500"}`}>
                          v{s.kitVersion}
                        </span>
                      )}
                    </span>
                  </a>
                </td>
                {s ? (
                  <>
                    <td className="py-2 pr-3 tabular-nums text-zinc-500 dark:text-zinc-400">
                      {s.files ?? "—"}
                    </td>
                    <td className="py-2 pr-3"><CodeBar s={s} /></td>
                    <td className="py-2 pr-3 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                      {s.savedPercent != null ? `${s.savedPercent}%` : "—"}
                    </td>
                    <td className={`py-2 text-right font-bold whitespace-nowrap ${s.quality ? GRADE_COLORS[s.quality.grade] ?? "" : ""}`}>
                      {s.quality ? `${s.quality.grade} ${s.quality.score}` : "—"}
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
