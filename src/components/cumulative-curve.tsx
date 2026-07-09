"use client";

const MILESTONES = [
  { value: 1_000, label: "1K" },
  { value: 10_000, label: "10K" },
  { value: 100_000, label: "100K" },
  { value: 1_000_000, label: "1M" },
];

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
