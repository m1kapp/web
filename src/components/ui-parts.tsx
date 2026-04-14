"use client";

import { useAccent } from "@/lib/theme-context";
import { EmptyState } from "@m1kapp/ui";

// ── 분석 바 차트 섹션 (accent 의존이라 로컬에 유지) ──
export function AnalyticsSection({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: number; href?: string }[];
}) {
  const { accent } = useAccent();
  const total = items.reduce((sum, i) => sum + i.value, 0);
  return (
    <div>
      <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-3">
        {title}
      </h3>
      {items.length === 0 ? (
        <EmptyState message="아직 데이터가 없어요" />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="flex-1 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-900 overflow-hidden relative">
                <div
                  className="absolute inset-y-0 left-0 rounded-lg"
                  style={{
                    width: `${total > 0 ? (item.value / total) * 100 : 0}%`,
                    backgroundColor: accent,
                    opacity: 0.15,
                  }}
                />
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="relative px-3 text-sm text-zinc-800 dark:text-zinc-200 leading-7 truncate block underline decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-current">
                    {item.label}
                  </a>
                ) : (
                  <span className="relative px-3 text-sm text-zinc-800 dark:text-zinc-200 leading-7 truncate block">
                    {item.label}
                  </span>
                )}
              </div>
              <span className="text-sm tabular-nums text-zinc-500 dark:text-zinc-400 w-8 text-right">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
