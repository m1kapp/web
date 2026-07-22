"use client";

import { useState } from "react";
import type { RecentSite } from "@/lib/types";
import type { SiteKitStats, SiteQuality, Bucket } from "./store-tab";
import { GRADE_COLORS, REFERENCE_ENTRIES, QualitySheet } from "./dev-table-quality";

// FE/BE/공용 라벨 색 — indigo·teal 동계열 + 중립 회색 (파랑/주황 보색 충돌 대신 톤 맞춤)
const BUCKET_COLORS = { frontend: "#6366f1", backend: "#14b8a6", shared: "#a1a1aa" } as const;

/** 파비콘 — 로드 실패 시 이니셜 원으로 폴백 (깨진 이미지 아이콘 방지) */
function SiteLogo({ name, faviconUrl }: { name: string; faviconUrl?: string | null }) {
  const [failed, setFailed] = useState(false);
  if (!faviconUrl || failed) {
    return (
      <span className="w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-700 shrink-0 flex items-center justify-center text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
        {name[0]?.toUpperCase()}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={faviconUrl}
      alt=""
      width={28}
      height={28}
      className="rounded-lg shrink-0 w-7 h-7 object-cover"
      onError={() => setFailed(true)}
    />
  );
}

/** 줄 구성 — FE/BE/공용 실제 LOC 숫자 (색은 헤더 범례와 매칭) */
function CodeLoc({ total, breakdown }: { total: number | null; breakdown: { frontend: Bucket; backend: Bucket; shared: Bucket } | null }) {
  if (!total) return <span className="text-zinc-300 dark:text-zinc-600">—</span>;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="tabular-nums font-semibold text-zinc-700 dark:text-zinc-200">{total.toLocaleString()}</span>
      {breakdown && (
        <span className="text-[9px] tabular-nums whitespace-nowrap">
          <span style={{ color: BUCKET_COLORS.frontend }}>{breakdown.frontend.codeLines.toLocaleString()}</span>
          <span className="text-zinc-300 dark:text-zinc-600">/</span>
          <span style={{ color: BUCKET_COLORS.backend }}>{breakdown.backend.codeLines.toLocaleString()}</span>
          <span className="text-zinc-300 dark:text-zinc-600">/</span>
          <span style={{ color: BUCKET_COLORS.shared }}>{breakdown.shared.codeLines.toLocaleString()}</span>
        </span>
      )}
    </div>
  );
}

function HealthCell({ quality, onOpen }: { quality: SiteQuality | null; onOpen: () => void }) {
  if (!quality) return <td className="py-2 pr-2 text-zinc-300 dark:text-zinc-600">—</td>;
  return (
    <td className="py-2 pr-2">
      <button
        onClick={onOpen}
        className={`font-bold whitespace-nowrap tabular-nums cursor-pointer hover:underline underline-offset-2 ${GRADE_COLORS[quality.grade] ?? ""}`}
      >
        {quality.grade} {quality.score}
      </button>
    </td>
  );
}

// 헬스(score) 열을 사이트 바로 옆 맨 왼쪽 데이터 열로 — 가로 스크롤 없이 바로 보이도록
const COLS = {
  site: "130px",
  health: "56px",
  files: "32px",
  code: "88px",
  perFile: "46px",
  kit: "34px",
};

function TableHead() {
  return (
    <thead>
      <tr className="text-[10px] text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">
        <th className="text-left font-medium py-1.5 pr-2 sticky left-0 z-10 bg-white dark:bg-zinc-950 whitespace-nowrap" style={{ width: COLS.site }}>사이트</th>
        <th className="text-left font-medium py-1.5 pr-2 whitespace-nowrap" style={{ width: COLS.health }}>health</th>
        <th className="text-left font-medium py-1.5 pr-2 whitespace-nowrap" style={{ width: COLS.files }}>파일</th>
        <th className="text-left font-medium py-1.5 pr-2 whitespace-nowrap" style={{ width: COLS.code }}>
          줄 <span style={{ color: BUCKET_COLORS.frontend }}>FE</span>/<span style={{ color: BUCKET_COLORS.backend }}>BE</span>/<span style={{ color: BUCKET_COLORS.shared }}>공용</span>
        </th>
        <th className="text-right font-medium py-1.5 pr-2 whitespace-nowrap" style={{ width: COLS.perFile }}>줄/파일</th>
        <th className="text-right font-medium py-1.5 whitespace-nowrap" style={{ width: COLS.kit }}>kit</th>
      </tr>
    </thead>
  );
}

/** dev 모드 비교 테이블 — 고정폭 열 + 가로 스크롤 (좁은 화면에서도 안 찌그러짐) */
export function DevTable({ sites, stats, latest }: {
  sites: RecentSite[];
  stats: Record<string, SiteKitStats> | undefined;
  latest: string | null;
}) {
  const [openQuality, setOpenQuality] = useState<{ name: string; quality: SiteQuality } | null>(null);

  const withStats = sites
    .map((site) => ({ site, s: stats?.[site.slug] }))
    .filter((x): x is { site: RecentSite; s: SiteKitStats } => !!x.s);

  if (withStats.length === 0) {
    return <p className="text-xs text-zinc-400 dark:text-zinc-500 py-6 text-center">kit-stats가 있는 사이트가 없어요</p>;
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4 pb-2">
      <table className="text-[11px] font-mono border-collapse" style={{ width: "386px", tableLayout: "fixed" }}>
        <TableHead />
        <tbody>
          {withStats.map(({ site, s }) => {
            const name = site.ogTitle || site.title || site.slug;
            const behind = !!(latest && s.kitVersion !== latest);
            return (
              <tr key={site.slug} className="border-b border-zinc-50 dark:border-zinc-900">
                <td className="py-2 pr-2 sticky left-0 z-10 bg-white dark:bg-zinc-950 overflow-hidden">
                  <a href={`/${site.slug}`} className="flex items-center gap-2 min-w-0 overflow-hidden">
                    <SiteLogo name={name} faviconUrl={site.faviconUrl} />
                    <span className="min-w-0">
                      <span className="block truncate font-sans font-medium text-zinc-700 dark:text-zinc-200">{name}</span>
                      <span className={`block text-[9px] tabular-nums whitespace-nowrap ${behind ? "text-amber-500 font-semibold" : "text-emerald-600 dark:text-emerald-500"}`}>
                        v{s.kitVersion}
                      </span>
                    </span>
                  </a>
                </td>
                <HealthCell quality={s.quality} onOpen={() => s.quality && setOpenQuality({ name, quality: s.quality })} />
                <td className="py-2 pr-2 tabular-nums text-zinc-500 dark:text-zinc-400">
                  {s.files ?? "—"}
                </td>
                <td className="py-2 pr-2"><CodeLoc total={s.codeLines} breakdown={s.breakdown} /></td>
                <td className="py-2 pr-2 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                  {s.quality?.avgFileLines ?? "—"}
                </td>
                <td className="py-2 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                  {s.savedPercent != null ? `${s.savedPercent}%` : "—"}
                </td>
              </tr>
            );
          })}

          {/* 참고 — 외부 오픈소스 벤치마크, 별도 구획 */}
          <tr>
            <td colSpan={6} className="pt-3 pb-1 pr-2 sticky left-0 z-10 bg-white dark:bg-zinc-950 text-[9px] text-zinc-300 dark:text-zinc-600 tracking-wide">
              ── 참고 (외부 OSS) ──
            </td>
          </tr>
          {REFERENCE_ENTRIES.map((r) => (
            <tr key={r.name} className="border-b border-zinc-50 dark:border-zinc-900 opacity-70">
              <td className="py-2 pr-2 sticky left-0 z-10 bg-white dark:bg-zinc-950 overflow-hidden">
                <a href={r.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-0 overflow-hidden">
                  <SiteLogo name={r.name} faviconUrl={null} />
                  <span className="min-w-0">
                    <span className="block truncate font-sans font-medium text-zinc-700 dark:text-zinc-200">{r.name}</span>
                    <span className="block text-[9px] text-zinc-400 dark:text-zinc-500 truncate">{r.note}</span>
                  </span>
                </a>
              </td>
              <HealthCell quality={r.quality} onOpen={() => setOpenQuality({ name: r.name, quality: r.quality })} />
              <td className="py-2 pr-2 tabular-nums text-zinc-500 dark:text-zinc-400">{r.files}</td>
              <td className="py-2 pr-2"><CodeLoc total={r.codeLines} breakdown={r.breakdown} /></td>
              <td className="py-2 pr-2 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                {r.quality.avgFileLines ?? "—"}
              </td>
              <td className="py-2 text-right tabular-nums text-zinc-300 dark:text-zinc-600">—</td>
            </tr>
          ))}
        </tbody>
      </table>

      {openQuality && (
        <QualitySheet name={openQuality.name} quality={openQuality.quality} onClose={() => setOpenQuality(null)} />
      )}
    </div>
  );
}
