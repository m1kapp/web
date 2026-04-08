"use client";

import { useEffect, useState } from "react";
import { useAccent } from "@/lib/theme-context";

interface CircularProgressProps {
  value: number;
  max: number;
}

export function CircularProgress({ value, max }: CircularProgressProps) {
  const { accent } = useAccent();
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const progress = Math.min(animatedValue / max, 1);
  const percentage = (progress * 100).toFixed(1);

  const size = 200;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* 배경 트랙 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-zinc-100 dark:text-zinc-800"
          />
          {/* 진행률 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={accent}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* 중앙 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black tabular-nums text-zinc-900 dark:text-white tracking-tight">
            {animatedValue.toLocaleString()}
          </span>
          <span className="text-sm text-zinc-400 dark:text-zinc-500 font-medium">
            / {max >= 1000 ? `${max / 1000}K` : max}
          </span>
        </div>
      </div>

      {/* 퍼센트 + 달성 뱃지 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 tabular-nums">
          {percentage}%
        </span>
        {progress >= 1 ? (
          <span
            className="text-xs font-bold text-white px-2 py-0.5 rounded-full"
            style={{ backgroundColor: accent }}
          >
            GOAL!
          </span>
        ) : (
          <span className="text-xs text-zinc-400 dark:text-zinc-500">달성</span>
        )}
      </div>

      {/* 마일스톤 */}
      <div className="flex items-center w-full max-w-[240px] gap-0.5">
        {[250, 500, 750, 1000].map((milestone) => (
          <div key={milestone} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`h-1.5 w-full rounded-full transition-colors duration-500 ${
                value < milestone ? "bg-zinc-200 dark:bg-zinc-800" : ""
              }`}
              style={value >= milestone ? { backgroundColor: accent } : undefined}
            />
            <span
              className={`text-[9px] tabular-nums font-medium ${
                value < milestone ? "text-zinc-300 dark:text-zinc-600" : ""
              }`}
              style={value >= milestone ? { color: accent } : undefined}
            >
              {milestone >= 1000 ? "1K" : milestone}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
