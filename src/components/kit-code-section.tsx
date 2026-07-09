"use client";

import { useAccent } from "@/lib/theme-context";

// ─── kit 코드 규모 ───────────────────────────────────────────────────────────

interface KitBucket {
  files: number;
  codeLines: number;
}

export interface KitSiteStats {
  kitVersion: string;
  files: number | null;
  codeLines: number | null;
  breakdown: { frontend: KitBucket; backend: KitBucket; shared: KitBucket } | null;
  savedPercent: number | null;
  savedLines: number | null;
  savedFiles: number | null;
  quality: { score: number; grade: string } | null;
}

export interface KitStatsPayload {
  latestKitVersion: string | null;
  stats: Record<string, KitSiteStats>;
}

/** 코드 규모 — 총|프론트|백엔드|공용 + m1kkit 절약 예상 테이블 */
export function KitCodeSection({ s, latest }: { s: KitSiteStats; latest: string | null }) {
  const { accent } = useAccent();
  const b = s.breakdown;

  const BUCKETS = [["프론트", "frontend"], ["백엔드", "backend"], ["공용", "shared"]] as const;
  const cols: { label: string; lines: number | null; files: number | null; kit?: boolean }[] = [
    { label: "총", lines: s.codeLines, files: s.files },
    ...BUCKETS.map(([label, key]) => ({
      label,
      lines: b ? b[key].codeLines : null,
      files: b ? b[key].files : null,
    })),
    { label: "kit 절약", lines: s.savedLines, files: s.savedFiles, kit: true },
  ];

  const behind = latest && s.kitVersion !== latest;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2.5">
        <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">코드 규모</p>
        <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
          @m1kapp/kit{" "}
          <span className={behind ? "text-amber-500 font-semibold" : ""} style={behind ? undefined : { color: accent }}>
            v{s.kitVersion}
          </span>
          {behind && <span className="text-zinc-400"> (latest v{latest})</span>}
          {s.quality && <> · 청결 {s.quality.grade}({s.quality.score})</>}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="text-[10px] text-zinc-400 dark:text-zinc-500">
              <th className="text-left font-medium py-1 pr-2" />
              {cols.map((c) => (
                <th key={c.label} className="text-right font-medium py-1 pl-3" style={c.kit ? { color: accent } : undefined}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-zinc-700 dark:text-zinc-300">
            <tr className="border-t border-zinc-100 dark:border-zinc-800">
              <td className="py-1.5 pr-2 text-[10px] text-zinc-400 dark:text-zinc-500">줄</td>
              {cols.map((c) => (
                <td key={c.label} className="text-right py-1.5 pl-3" style={c.kit ? { color: accent } : undefined}>
                  {c.lines != null ? `${c.kit ? "+" : ""}${c.lines.toLocaleString()}` : "–"}
                </td>
              ))}
            </tr>
            <tr className="border-t border-zinc-100 dark:border-zinc-800">
              <td className="py-1.5 pr-2 text-[10px] text-zinc-400 dark:text-zinc-500">파일</td>
              {cols.map((c) => (
                <td key={c.label} className="text-right py-1.5 pl-3" style={c.kit ? { color: accent } : undefined}>
                  {c.files != null ? `${c.kit ? "+" : ""}${c.files.toLocaleString()}` : "–"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {s.savedPercent != null && (
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1.5">
          kit이 없었다면 약 <span style={{ color: accent }}>{s.savedLines?.toLocaleString()}줄·{s.savedFiles}파일</span>을 직접 만들었을 것 (전체의 {s.savedPercent}%)
        </p>
      )}
    </div>
  );
}
