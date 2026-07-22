"use client";

import { InAppSheet } from "@m1kapp/kit";
import type { SiteQuality, Bucket } from "./store-tab";

export const GRADE_COLORS: Record<string, string> = {
  "A+": "text-emerald-500",
  A: "text-green-500",
  B: "text-lime-600 dark:text-lime-500",
  C: "text-amber-500",
  D: "text-red-500",
};

/** 참고용 외부 오픈소스 벤치마크 — 라이브 사이트 목록이 아니라 하드코딩된 1회성 측정치.
 *  m1kkit stats로 직접 돌려본 결과를 옮긴 것이라 sites API 갱신과 무관하게 고정. */
export const REFERENCE_ENTRIES: {
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

function CheckItem({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5">
      <div className="text-[9px] text-zinc-400 dark:text-zinc-500">{label}</div>
      <div className="font-semibold text-zinc-700 dark:text-zinc-200 tabular-nums">{value}</div>
      {sub && <div className="text-[9px] text-zinc-300 dark:text-zinc-600 truncate font-mono">{sub}</div>}
    </div>
  );
}

/** health 클릭 시 뜨는 상세 체크항목 바텀시트 */
export function QualitySheet({ name, quality, onClose }: { name: string; quality: SiteQuality; onClose: () => void }) {
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
