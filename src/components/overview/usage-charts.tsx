"use client";

import { useAccent } from "@/lib/theme-context";
import type { SiteData } from "../dashboard-view";

// ─── 시간대 영역 그래프 ───────────────────────────────────────────────────────

export function HourlyAreaChart({ hourly }: { hourly: SiteData["hourly"] }) {
  const { accent } = useAccent();
  if (!hourly.length) return null;

  const hourMap = new Map(hourly.map((h) => [h.hour, Number(h.count)]));
  const counts = Array.from({ length: 24 }, (_, i) => hourMap.get(i) ?? 0);
  const max = Math.max(...counts, 1);

  const W = 300, H = 64, PAD_TOP = 6, PAD_BOTTOM = 16;
  const CHART_H = H - PAD_TOP - PAD_BOTTOM;
  const baseY = PAD_TOP + CHART_H;

  function xOf(i: number) { return (i / 23) * W; }
  function yOf(v: number) { return PAD_TOP + CHART_H - (v / max) * CHART_H; }

  const pts = counts.map((v, i) => ({ x: xOf(i), y: yOf(v) }));
  let linePath = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1], curr = pts[i];
    const cpx = (prev.x + curr.x) / 2;
    linePath += ` C ${cpx.toFixed(1)} ${prev.y.toFixed(1)} ${cpx.toFixed(1)} ${curr.y.toFixed(1)} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }
  const areaPath = `${linePath} L ${W} ${baseY} L 0 ${baseY} Z`;
  const peakHours = [...counts.map((v, i) => ({ h: i, v }))].sort((a, b) => b.v - a.v).slice(0, 2).filter((p) => p.v > 0);
  const gradId = `hag${accent.replace(/[^a-f0-9]/gi, "")}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: "visible" }} aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={accent} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
      {peakHours.map(({ h, v }) => {
        const x = xOf(h), y = yOf(v);
        const label = h === 0 ? "자정" : h === 12 ? "정오" : h < 12 ? `오전 ${h}시` : `오후 ${h - 12}시`;
        const anchor = x < 30 ? "start" : x > W - 30 ? "end" : "middle";
        return (
          <g key={h}>
            <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r="3" fill={accent} />
            <text x={x.toFixed(1)} y={(y - 6).toFixed(1)} textAnchor={anchor}
              fontSize="8.5" fill={accent} fontWeight="600" fontFamily="inherit">{label}</text>
          </g>
        );
      })}
      {[0, 6, 12, 18, 23].map((h) => (
        <text key={h} x={xOf(h).toFixed(1)} y={H}
          textAnchor={h === 0 ? "start" : h === 23 ? "end" : "middle"}
          fontSize="9" fill="#a1a1aa" fontFamily="inherit">{h}시</text>
      ))}
    </svg>
  );
}

// ─── 디바이스 ─────────────────────────────────────────────────────────────────

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  mobile: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12" y2="18" strokeWidth="3" /></svg>,
  desktop: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>,
  tablet: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="12" y1="18" x2="12" y2="18" strokeWidth="3" /></svg>,
};
const DEVICE_COLORS = ["#f97316", "#8b5cf6", "#06b6d4", "#10b981", "#a1a1aa"];

export function DeviceBar({ devices }: { devices: SiteData["devices"] }) {
  if (!devices.length) return null;
  const total = devices.reduce((s, d) => s + Number(d.count), 0);
  if (!total) return null;
  return (
    <div className="space-y-2">
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        {devices.map((d, i) => (
          <div key={d.device ?? i}
            style={{ width: `${(Number(d.count) / total) * 100}%`, backgroundColor: DEVICE_COLORS[i] }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {devices.map((d, i) => {
          const pct = Math.round((Number(d.count) / total) * 100);
          const name = d.device ?? "기타";
          return (
            <div key={name} className="flex items-center gap-1.5">
              <span style={{ color: DEVICE_COLORS[i] }}>{DEVICE_ICONS[name] ?? DEVICE_ICONS.desktop}</span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 capitalize">{name}</span>
              <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 브라우저 · OS ───────────────────────────────────────────────────────────

const BROWSER_COLORS = ["#3b82f6", "#f97316", "#10b981", "#8b5cf6", "#a1a1aa"];
const OS_COLORS      = ["#06b6d4", "#f43f5e", "#eab308", "#8b5cf6", "#a1a1aa"];

function StackedBarLegend({ items, colors }: { items: { name: string; pct: number }[]; colors: string[] }) {
  const total = items.reduce((s, d) => s + d.pct, 0);
  return (
    <div className="space-y-1.5">
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        {items.map((d, i) => (
          <div key={d.name} style={{ width: `${(d.pct / (total || 1)) * 100}%`, backgroundColor: colors[i] }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {items.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[i] }} />
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{d.name}</span>
            <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BrowserOsBar({ browsers, os }: { browsers: SiteData["browsers"]; os: SiteData["os"] }) {
  function prepare(arr: { browser?: string | null; os?: string | null; count: number }[], key: "browser" | "os") {
    const valid = arr.filter((d) => d[key]).map((d) => ({ name: d[key] as string, count: Number(d.count) }));
    const total = valid.reduce((s, d) => s + d.count, 0);
    if (!total) return [];
    const top = valid.slice(0, 4);
    const rest = valid.slice(4).reduce((s, d) => s + d.count, 0);
    if (rest > 0) top.push({ name: "기타", count: rest });
    return top.map((d) => ({ name: d.name, pct: Math.round((d.count / total) * 100) }));
  }

  const bItems = prepare(browsers as { browser: string | null; count: number }[], "browser");
  const oItems = prepare(os as { os: string | null; count: number }[], "os");

  if (!bItems.length && !oItems.length) return null;

  return (
    <div className="space-y-4">
      {bItems.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mb-1.5">브라우저</p>
          <StackedBarLegend items={bItems} colors={BROWSER_COLORS} />
        </div>
      )}
      {oItems.length > 0 && (
        <div>
          <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 mb-1.5">운영체제</p>
          <StackedBarLegend items={oItems} colors={OS_COLORS} />
        </div>
      )}
    </div>
  );
}

// ─── 유입 경로 ────────────────────────────────────────────────────────────────

export function RefererList({ referers }: { referers: SiteData["referers"] }) {
  const { accent } = useAccent();
  if (!referers.length) return null;
  const max = Math.max(...referers.map((r) => Number(r.count)));
  return (
    <div className="space-y-2">
      {referers.slice(0, 4).map((r, i) => {
        const label = !r.referer ? "직접 접속" : r.referer === "/" ? "/" : r.referer;
        const pct = (Number(r.count) / max) * 100;
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 flex-1 truncate min-w-0">{label}</span>
            <div className="w-20 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accent, opacity: 0.6 }} />
            </div>
            <span className="text-[11px] tabular-nums text-zinc-400 w-6 text-right shrink-0">{Number(r.count)}</span>
          </div>
        );
      })}
    </div>
  );
}
