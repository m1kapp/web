"use client";

import { useState } from "react";
import { InAppSheet } from "@m1kapp/kit";
import { SiteThumbnail } from "@/components/site-preview-card";
import type { RecentSite } from "@/lib/types";
import type { SiteKitStats, SiteQuality, Bucket } from "./store-tab";

const GRADE_COLORS: Record<string, string> = {
  "A+": "text-emerald-500",
  A: "text-green-500",
  B: "text-lime-600 dark:text-lime-500",
  C: "text-amber-500",
  D: "text-red-500",
};

// FE/BE/공용 라벨 색 — indigo·teal 동계열 + 중립 회색 (파랑/주황 보색 충돌 대신 톤 맞춤)
const BUCKET_COLORS = { frontend: "#6366f1", backend: "#14b8a6", shared: "#a1a1aa" } as const;

/** 참고용 외부 오픈소스 벤치마크 — 라이브 사이트 목록이 아니라 하드코딩된 1회성 측정치.
 *  m1kkit stats로 직접 돌려본 결과를 옮긴 것이라 sites API 갱신과 무관하게 고정. */
const REFERENCE_ENTRIES: {
  name: string;
  href: string;
  note: string;
  files: number;
  codeLines: number;
  breakdown: { frontend: Bucket; backend: Bucket; shared: Bucket };
  quality: SiteQuality;
}[] = [
  {
    name: "svg-favicon-generator",
    href: "https://github.com/andygock/svg-favicon-generator",
    note: "참고 · 외부 OSS (kit 미사용)",
    files: 11,
    codeLines: 1466,
    breakdown: {
      frontend: { files: 9, codeLines: 1216 },
      backend: { files: 0, codeLines: 0 },
      shared: { files: 2, codeLines: 250 },
    },
    quality: {
      score: 79,
      grade: "B",
      engine: "regex",
      branchDensity: 11.4,
      avgFileLines: 133,
      longFiles: 2,
      maxFile: { path: "src/App.jsx", lines: 395 },
      cognitive: null,
      duplication: null,
    },
  },
];

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

/** health 클릭 시 뜨는 상세 체크항목 바텀시트 */
function QualitySheet({ name, quality, onClose }: { name: string; quality: SiteQuality; onClose: () => void }) {
  const cog = quality.cognitive;
  const dup = quality.duplication;
  return (
    <InAppSheet open onClose={onClose} title={`${name} — 청결도 상세`}>
      <div className="px-5 pb-6 max-h-[70vh] overflow-y-auto space-y-4 text-sm">
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-black ${GRADE_COLORS[quality.grade] ?? ""}`}>{quality.grade}</span>
          <span className="text-zinc-400 dark:text-zinc-500 font-mono text-sm">{quality.score}점</span>
          {quality.engine && (
            <span className="ml-auto text-[10px] font-mono text-zinc-300 dark:text-zinc-600">{quality.engine}</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <CheckItem label="평균 파일 길이" value={quality.avgFileLines != null ? `${quality.avgFileLines}줄` : "—"} />
          <CheckItem label="200줄+ 파일" value={quality.longFiles != null ? `${quality.longFiles}개` : "—"} />
          <CheckItem label="분기밀도" value={`${quality.branchDensity}/100줄`} />
          <CheckItem label="최장 파일" value={quality.maxFile ? `${quality.maxFile.lines}줄` : "—"} sub={quality.maxFile?.path} />
        </div>

        {cog ? (
          <div>
            <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">
              cognitive complexity — 평균 {cog.avg}·최대 {cog.max} (cog15+ {cog.over15}개·cog25+ {cog.over25}개)
            </div>
            {cog.worst.length > 0 && (
              <ul className="space-y-1">
                {cog.worst.map((f, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                    <span className="truncate">{f.name} <span className="text-zinc-300 dark:text-zinc-600">{f.file}:{f.line}</span></span>
                    <span className="shrink-0 font-semibold text-zinc-700 dark:text-zinc-200">cog {f.cog}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            cognitive complexity 미측정 (typescript 미설치 — regex 폴백만 적용됨)
          </p>
        )}

        {dup && (
          <div>
            <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 mb-1.5">
              중복 코드 — {dup.percent}%
            </div>
            {dup.worstFiles.length > 0 && (
              <ul className="space-y-1">
                {dup.worstFiles.map((f, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                    <span className="truncate">{f.file}</span>
                    <span className="shrink-0">{f.dupTokens} tok</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </InAppSheet>
  );
}

function CheckItem({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5">
      <div className="text-[9px] text-zinc-400 dark:text-zinc-500">{label}</div>
      <div className="font-semibold text-zinc-700 dark:text-zinc-200 tabular-nums">{value}</div>
      {sub && <div className="text-[9px] text-zinc-300 dark:text-zinc-600 truncate font-mono">{sub}</div>}
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
// site 열 폭·로고·글자 크기는 un-kit 모드(SiteCard)와 동일하게 맞춤 (40px 아바타 + text-sm)
const COLS = {
  site: "168px",
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
      <table className="text-[11px] font-mono border-collapse" style={{ width: "424px", tableLayout: "fixed" }}>
        <TableHead />
        <tbody>
          {withStats.map(({ site, s }) => {
            const name = site.ogTitle || site.title || site.slug;
            const behind = !!(latest && s.kitVersion !== latest);
            return (
              <tr key={site.slug} className="border-b border-zinc-50 dark:border-zinc-900">
                <td className="py-2 pr-2 sticky left-0 z-10 bg-white dark:bg-zinc-950 overflow-hidden">
                  <a href={`/${site.slug}`} className="flex items-center gap-3 min-w-0 overflow-hidden">
                    <SiteThumbnail slug={site.slug} name={name} faviconUrl={site.faviconUrl} color={site.color} />
                    <span className="min-w-0 font-sans">
                      <span className="block truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">{name}</span>
                      <span className={`block text-[10px] tabular-nums whitespace-nowrap ${behind ? "text-amber-500 font-semibold" : "text-emerald-600 dark:text-emerald-500"}`}>
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
                <a href={r.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 min-w-0 overflow-hidden">
                  <SiteThumbnail slug={r.name} name={r.name} faviconUrl={null} />
                  <span className="min-w-0 font-sans">
                    <span className="block truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">{r.name}</span>
                    <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{r.note}</span>
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
