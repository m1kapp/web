"use client";

import { useState, useMemo } from "react";
import { useAccent } from "@/lib/theme-context";

interface DailyData {
  date: string;
  count: number;
}

interface GrassMapProps {
  daily: DailyData[];
  createdAt?: string | null;
}

const CELL_SIZE = 13;
const GAP = 3;
const STEP = CELL_SIZE + GAP;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_LABEL = ["", "Mon", "", "Wed", "", "Fri", ""];

export function GrassMap({ daily, createdAt }: GrassMapProps) {
  const { isDark, accent } = useAccent();

  // 사용 가능한 연도 목록
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    const currentYear = new Date().getFullYear();
    years.add(currentYear);
    for (const d of daily) {
      years.add(new Date(d.date).getFullYear());
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [daily]);

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const countMap = useMemo(
    () => new Map(daily.map((d) => [d.date, d.count])),
    [daily]
  );

  // 첫 방문일
  const firstDay = daily.length > 0 ? daily[0].date : null;
  const firstDayFormatted = firstDay
    ? new Date(firstDay).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  // 선택 연도의 1/1 ~ 12/31 (항상 전체 연도 표시)
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const yearStart = new Date(selectedYear, 0, 1);
  const yearEnd = new Date(selectedYear, 11, 31);

  // 시작점을 일요일로 맞추기
  const start = new Date(yearStart);
  start.setDate(start.getDate() - start.getDay());

  const days: { date: string; count: number; col: number; row: number; isOutOfRange: boolean; isFuture: boolean }[] = [];

  const totalDays = Math.ceil((yearEnd.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  for (let i = 0; i < totalDays; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    if (date > yearEnd) break;
    const key = date.toISOString().split("T")[0];
    const col = Math.floor(i / 7);
    const row = i % 7;
    const isOutOfRange = date < yearStart;
    const isFuture = date > today;
    days.push({ date: key, count: countMap.get(key) || 0, col, row, isOutOfRange, isFuture });
  }

  const maxCount = Math.max(...days.map((d) => d.count), 1);
  const totalCols = days.length > 0 ? Math.max(...days.map((d) => d.col)) + 1 : 1;

  // 월 라벨 위치 계산
  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  for (const day of days) {
    if (day.row !== 0 || day.isOutOfRange) continue;
    const month = new Date(day.date).getMonth();
    if (month !== lastMonth) {
      monthLabels.push({ label: MONTHS[month], col: day.col });
      lastMonth = month;
    }
  }

  const leftPad = 36;
  const topPad = 22;
  const svgWidth = leftPad + totalCols * STEP;
  const svgHeight = topPad + 7 * STEP;

  return (
    <div className="space-y-4">
      {/* 상단: 연도 필터 + 첫 방문일 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          {availableYears.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedYear === year
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {year}
            </button>
          ))}
        </div>
        {firstDayFormatted && (
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            첫 방문 <span className="font-medium text-zinc-600 dark:text-zinc-400">{firstDayFormatted}</span>
          </p>
        )}
      </div>

      {/* 히트맵 */}
      <div className="overflow-x-auto">
        <svg width={svgWidth} height={svgHeight} className="block mx-auto">
          {/* 월 라벨 */}
          {monthLabels.map((m, i) => (
            <text
              key={`${m.label}-${i}`}
              x={leftPad + m.col * STEP}
              y={13}
              className="fill-zinc-400"
              fontFamily="system-ui, sans-serif"
              fontSize={10}
            >
              {m.label}
            </text>
          ))}

          {/* 요일 라벨 */}
          {DAYS_LABEL.map((label, i) =>
            label ? (
              <text
                key={i}
                x={0}
                y={topPad + i * STEP + CELL_SIZE - 2}
                className="fill-zinc-300"
                fontFamily="system-ui, sans-serif"
                fontSize={9}
              >
                {label}
              </text>
            ) : null
          )}

          {/* 셀 */}
          {days.map((day) => {
            const isToday = day.date === todayStr;
            const isFirst = day.date === firstDay;
            const cellFill = day.isOutOfRange
              ? "transparent"
              : day.isFuture
                ? isDark ? "rgb(24, 24, 27)" : "rgb(250, 250, 250)"
                : isFirst
                  ? accent
                  : grassColor(day.count, maxCount, isDark, accent);
            const hasStroke = isFirst;
            const strokeColor = isFirst ? accent : "none";

            return (
              <rect
                key={day.date}
                x={leftPad + day.col * STEP}
                y={topPad + day.row * STEP}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={3}
                fill={cellFill}
                stroke={strokeColor}
                strokeWidth={hasStroke ? 1.5 : 0}
              >
                <title>
                  {isFirst
                    ? `${day.date}: ${day.count}명 (첫 방문일!)`
                    : isToday
                      ? `${day.date}: ${day.count}명 (오늘)`
                      : day.isFuture
                        ? day.date
                        : `${day.date}: ${day.count}명`}
                </title>
              </rect>
            );
          })}
        </svg>
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-end gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500">
        <span>Less</span>
        {[0, 0.15, 0.35, 0.6, 0.85].map((ratio, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-xs"
            style={{ backgroundColor: ratio === 0 ? (isDark ? "rgb(39, 39, 42)" : "rgb(244, 244, 245)") : grassColor(Math.ceil(ratio * 10), 10, isDark, accent) }}
          />
        ))}
        <span>More</span>
        <div className="ml-2 w-3 h-3 rounded-xs" style={{ backgroundColor: accent, opacity: 0.6 }} />
        <span>1st</span>
      </div>
    </div>
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function grassColor(count: number, max: number, isDark: boolean, accent: string): string {
  if (count === 0) return isDark ? "rgb(39, 39, 42)" : "rgb(244, 244, 245)";
  const ratio = count / max;
  const [r, g, b] = hexToRgb(accent);

  if (isDark) {
    const opacities = [0.25, 0.4, 0.6, 0.9];
    const o = ratio > 0.75 ? opacities[3] : ratio > 0.5 ? opacities[2] : ratio > 0.25 ? opacities[1] : opacities[0];
    return `rgba(${r}, ${g}, ${b}, ${o})`;
  }
  const mixes = [0.8, 0.6, 0.4, 0.15];
  const m = ratio > 0.75 ? mixes[3] : ratio > 0.5 ? mixes[2] : ratio > 0.25 ? mixes[1] : mixes[0];
  return `rgb(${Math.round(r + (255 - r) * m)}, ${Math.round(g + (255 - g) * m)}, ${Math.round(b + (255 - b) * m)})`;
}
