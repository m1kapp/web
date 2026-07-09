"use client";

import { useAccent } from "@/lib/theme-context";
import { Section } from "@m1kapp/kit";
import { SitePreviewCard } from "./site-preview-card";
import { ShareButton } from "./share-button";
import { todayKST } from "@/lib/format";
import type { SiteData } from "./dashboard-view";
import { Avatar } from "./avatar";

const MILESTONES = [
  { value: 1_000,     label: "1K"  },
  { value: 10_000,    label: "10K" },
  { value: 100_000,   label: "100K"},
  { value: 1_000_000, label: "1M"  },
];

function calcStreak(daily: { date: string; count: number }[], today: Date = new Date()): number {
  if (daily.length === 0) return 0;
  const dates = new Set(daily.filter((d) => d.count > 0).map((d) => d.date));
  const todayStr = todayKST(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = todayKST(yesterday);
  const start = dates.has(todayStr) ? todayStr : dates.has(yesterdayStr) ? yesterdayStr : null;
  if (!start) return 0;
  let streak = 0;
  const cursor = new Date(start);
  while (dates.has(todayKST(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function hoursToReach(daily: { date: string; count: number }[], target: number): number | null {
  let sum = 0;
  for (let i = 0; i < daily.length; i++) {
    sum += daily[i].count;
    if (sum >= target) return (i + 1) * 24;
  }
  return null;
}

function getContextLine(data: SiteData, streak: number): string {
  const { total, todayCount, daily, verified } = data;
  const remaining = 1_000 - total;
  const hours1K = hoursToReach(daily, 1_000);
  const activeDays = daily.filter((d) => d.count > 0).length;

  if (streak >= 30) return `🏆 ${streak}일 연속 — 진짜 대단해요`;
  if (streak >= 14) return `🔥 ${streak}일 연속 중 — 멈추면 안 돼요`;
  if (streak >= 7)  return `🔥 ${streak}일 연속 — 불타고 있어요`;
  if (total >= 1_000 && hours1K) {
    const label = hours1K > 100 ? `${Math.round(hours1K / 24)}일` : `${hours1K}시간`;
    return `🚀 ${label} 만에 1K 달성 · 10K 가즈아`;
  }
  if (remaining > 0 && remaining <= 50) return `⚡ ${remaining}명만 더하면 1K!`;
  if (remaining > 0 && remaining <= 200) return `💪 1K까지 ${remaining.toLocaleString()}명 남았어요`;
  if (todayCount > 0 && streak > 1) return `오늘도 ${todayCount.toLocaleString()}명 방문 중 · ${streak}일 연속`;
  if (todayCount > 0) return `오늘 ${todayCount.toLocaleString()}명이 찾아왔어요`;
  if (activeDays > 0) return `방문자 트래커 달고 ${activeDays}일째 기록 중`;
  if (!verified) return `뱃지를 심으면 방문자 추적이 시작돼요`;
  return `트래커 설치 완료 — 첫 방문자를 기다리는 중`;
}

export function StreakChip({ daily }: { daily: { date: string; count: number }[] }) {
  const streak = calcStreak(daily);
  const legendary = streak >= 30;
  const hot      = streak >= 7;
  const active   = streak > 0;

  const bgClass = legendary
    ? "bg-yellow-50 dark:bg-yellow-950/30"
    : hot
    ? "bg-orange-50 dark:bg-orange-950/30"
    : "bg-zinc-50 dark:bg-zinc-900";

  const labelColor = legendary ? "text-yellow-500" : hot ? "text-orange-400" : "text-zinc-400";
  const valueColor = legendary
    ? "text-yellow-500"
    : hot
    ? "text-orange-500"
    : active
    ? "text-zinc-900 dark:text-white"
    : "text-zinc-300 dark:text-zinc-600";

  const glow = legendary
    ? "0 0 16px #f59e0b33"
    : hot
    ? "0 0 12px #f9731633"
    : undefined;

  return (
    <div
      className={`flex-1 rounded-xl py-3 px-3 text-center transition-all ${bgClass}`}
      style={glow ? { boxShadow: glow } : undefined}
    >
      <p className={`text-[10px] mb-0.5 font-medium ${labelColor}`}>
        {legendary ? "🏆 연속" : hot ? "🔥 연속" : "연속"}
      </p>
      <p className={`text-lg font-black tabular-nums ${valueColor}`}>
        {active ? `${streak}일` : "–"}
      </p>
    </div>
  );
}

const CURVE_W = 300;
const CURVE_PAD_LEFT = 34; // Y축 라벨 공간
const CURVE_CHART_H = 90;
const CURVE_LABEL_H = 18;

function fmtCurveY(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}K`;
  return Math.round(v).toString();
}

/** 누적 곡선 SVG 지오메트리 — 레이아웃·경로·눈금·milestone 교차점 계산 (순수 함수) */
function buildCurveGeometry(daily: { date: string; count: number }[], total: number) {
  const cumulative: number[] = [];
  let sum = 0;
  for (const d of daily) {
    sum += d.count;
    cumulative.push(sum);
  }
  if (cumulative.length === 0 || total === 0) return null;

  const n = cumulative.length;
  const CHART_W = CURVE_W - CURVE_PAD_LEFT;

  // milestone 달성 여부에 따라 위 여백 결정
  const hasCrossing = MILESTONES.some((m) => total >= m.value);
  const PAD_TOP = hasCrossing ? 28 : 8;
  const H = PAD_TOP + CURVE_CHART_H + CURVE_LABEL_H;
  const baseY = PAD_TOP + CURVE_CHART_H;

  // Y축: 현재 데이터 기준 스케일
  const dataMax = Math.max(...cumulative);
  const yAxisMax = dataMax * 1.25;

  // 다음 milestone이 Y축 범위 안에 들어오면 가이드라인 표시
  const nextMs = MILESTONES.find((m) => total < m.value);
  const showGoalLine = !!nextMs && nextMs.value <= yAxisMax * 1.05;

  const xOf = (i: number) => CURVE_PAD_LEFT + (n === 1 ? CHART_W / 2 : (i / (n - 1)) * CHART_W);
  const yOf = (val: number) => PAD_TOP + CURVE_CHART_H - Math.min(val / yAxisMax, 1) * CURVE_CHART_H;

  // Y축 눈금: 0, mid, top
  const yTicks = [dataMax, dataMax / 2].map((v) => ({ val: v, y: yOf(v), label: fmtCurveY(v) }));

  const pts = cumulative.map((v, i) => ({ x: xOf(i), y: yOf(v) }));

  let linePath = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cpx = (prev.x + curr.x) / 2;
    linePath += ` C ${cpx.toFixed(1)} ${prev.y.toFixed(1)} ${cpx.toFixed(1)} ${curr.y.toFixed(1)} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }
  const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${baseY} L ${pts[0].x.toFixed(1)} ${baseY} Z`;

  // milestone 교차점
  const crossings: { x: number; y: number; label: string }[] = [];
  for (const ms of MILESTONES) {
    if (total < ms.value) break;
    const i = cumulative.findIndex((v) => v >= ms.value);
    if (i >= 0) crossings.push({ x: xOf(i), y: yOf(cumulative[i]), label: ms.label });
  }

  // X 레이블
  const labelIdxs = [...new Set([0, n > 6 ? Math.round(n / 2) : -1, n - 1].filter((i) => i >= 0 && i < n))];

  return { n, H, baseY, nextMs, showGoalLine, yOf, yTicks, pts, linePath, areaPath, crossings, labelIdxs };
}

export function CumulativeCurve({ daily, total, todayCount, accent }: {
  daily: { date: string; count: number }[];
  total: number;
  todayCount: number;
  accent: string;
}) {
  const geo = buildCurveGeometry(daily, total);

  if (!geo) {
    return (
      <div className="h-24 flex items-center justify-center">
        <p className="text-[12px] text-zinc-300 dark:text-zinc-700 text-center leading-relaxed">
          트래커를 사이트에 달면<br />여기에 성장 곡선이 그려져요
        </p>
      </div>
    );
  }

  const { n, H, baseY, nextMs, showGoalLine, yOf, yTicks, pts, linePath, areaPath, crossings, labelIdxs } = geo;
  const W = CURVE_W;
  const PAD_LEFT = CURVE_PAD_LEFT;

  // 오늘 라이브 dot
  const lastPt = pts[pts.length - 1];
  const showLive = todayCount > 0;

  const gradId = `ccg${accent.replace(/[^a-f0-9]/gi, "")}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.03" />
        </linearGradient>
      </defs>

      {/* Y축 눈금 + 수평 그리드 */}
      {yTicks.map(({ val, y, label }) => (
        <g key={val}>
          <line x1={PAD_LEFT} y1={y.toFixed(1)} x2={W} y2={y.toFixed(1)}
            stroke="#e4e4e7" strokeWidth="1" className="dark:stroke-zinc-800" />
          <text x={(PAD_LEFT - 4).toFixed(1)} y={(y + 3.5).toFixed(1)}
            textAnchor="end" fontSize="9" fill="#a1a1aa" fontFamily="inherit">
            {label}
          </text>
        </g>
      ))}

      {/* 다음 milestone 가이드라인 (Y축 범위 안에 있을 때만) */}
      {showGoalLine && nextMs && (() => {
        const gy = yOf(nextMs.value);
        return (
          <g>
            <line x1="0" y1={gy.toFixed(1)} x2={W} y2={gy.toFixed(1)}
              stroke={accent} strokeWidth="1" strokeDasharray="4 4" opacity="0.2" />
            <text x={W - 2} y={(gy - 3).toFixed(1)}
              textAnchor="end" fontSize="8" fill={accent} opacity="0.45" fontFamily="inherit">
              {nextMs.label}
            </text>
          </g>
        );
      })()}

      {/* 면적 채우기 */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* 곡선 */}
      <path d={linePath} fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* milestone 마커 */}
      {crossings.map((c) => {
        const pillW = c.label.length <= 2 ? 26 : c.label.length <= 3 ? 32 : 38;
        const pillX = Math.min(Math.max(c.x - pillW / 2, 2), W - pillW - 2);
        const pillY = c.y - 26;
        return (
          <g key={c.label}>
            <line x1={c.x.toFixed(1)} y1={(c.y + 4).toFixed(1)} x2={c.x.toFixed(1)} y2={baseY.toFixed(1)}
              stroke={accent} strokeWidth="1" strokeDasharray="3 3" opacity="0.25" />
            <line x1={c.x.toFixed(1)} y1={(pillY + 16).toFixed(1)} x2={c.x.toFixed(1)} y2={(c.y - 5).toFixed(1)}
              stroke={accent} strokeWidth="1" opacity="0.3" />
            <circle cx={c.x.toFixed(1)} cy={c.y.toFixed(1)} r="4.5" fill="white" stroke={accent} strokeWidth="1.5" />
            <rect x={pillX.toFixed(1)} y={pillY.toFixed(1)} width={pillW} height="16" rx="8" fill={accent} />
            <text x={(pillX + pillW / 2).toFixed(1)} y={(pillY + 12).toFixed(1)}
              textAnchor="middle" fontSize="9" fontWeight="bold" fill="white" fontFamily="inherit">
              {c.label}
            </text>
          </g>
        );
      })}

      {/* 오늘 라이브 dot (milestone 마커랑 안 겹칠 때) */}
      {showLive && crossings.every((c) => Math.abs(c.x - lastPt.x) > 8) && (
        <g>
          {/* 펄스 링 */}
          <circle cx={lastPt.x.toFixed(1)} cy={lastPt.y.toFixed(1)} r="8" fill={accent} opacity="0.12">
            <animate attributeName="r" values="5;12" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.18;0" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx={lastPt.x.toFixed(1)} cy={lastPt.y.toFixed(1)} r="4" fill={accent} />
          <circle cx={lastPt.x.toFixed(1)} cy={lastPt.y.toFixed(1)} r="2" fill="white" />
        </g>
      )}

      {/* milestone 없는 일반 끝 점 */}
      {!showLive && crossings.every((c) => Math.abs(c.x - lastPt.x) > 8) && (
        <circle cx={lastPt.x.toFixed(1)} cy={lastPt.y.toFixed(1)} r="3.5" fill={accent} />
      )}

      {/* X 레이블 */}
      {labelIdxs.map((i) => {
        const x = pts[i].x;
        const anchor = i === 0 ? "start" : i === n - 1 ? "end" : "middle";
        return (
          <text key={i} x={x.toFixed(1)} y={H - 3}
            textAnchor={anchor} fontSize="9" fill="#a1a1aa" fontFamily="inherit">
            {i + 1}일
          </text>
        );
      })}
    </svg>
  );
}

export function SiteHero({ data, owner }: {
  data: SiteData;
  owner?: { handle: string; name: string; imageUrl: string } | null;
}) {
  const { accent } = useAccent();
  const displayName = data.ogTitle || data.title || data.slug;
  const streak = calcStreak(data.daily);
  const contextLine = getContextLine(data, streak);

  return (
    <Section className="pt-4 pb-2">
      {/* 사이트 카드 */}
      <SitePreviewCard
        slug={data.slug}
        name={displayName}
        faviconUrl={data.faviconUrl}
        color={accent}
        description={data.ogDescription}
        thumbnailSize="lg"
        variant="bare"
        right={<ShareButton slug={data.slug} title={displayName} />}
      />

      {/* 오너 링크 */}
      {owner?.handle && (
        <a
          href={`/@${owner.handle}`}
          className="flex items-center justify-end gap-1.5 mt-1.5 group"
        >
          <span className="text-[11px] text-zinc-300 dark:text-zinc-600">built by</span>
          <Avatar imageUrl={owner.imageUrl} name={owner.name} size={20} ring={false} />
          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
            @{owner.handle}
          </span>
        </a>
      )}

      {/* 히어로 숫자 */}
      <div className="mt-3 mb-0">
        <div className="flex items-end gap-1.5">
          <span className="text-[36px] font-black tabular-nums leading-none tracking-tight text-zinc-900 dark:text-white">
            {data.total.toLocaleString()}
          </span>
          <span className="text-sm font-semibold text-zinc-300 dark:text-zinc-600 mb-1">명 방문</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          {data.todayCount > 0 && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-lg tabular-nums"
              style={{ color: accent, backgroundColor: `${accent}1a` }}
            >
              +{data.todayCount.toLocaleString()} 오늘
            </span>
          )}
          {streak > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-500">
              🔥 {streak}일
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 leading-relaxed">
          {contextLine}
        </p>
      </div>
    </Section>
  );
}
