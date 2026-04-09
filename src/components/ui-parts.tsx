"use client";

import { useAccent } from "@/lib/theme-context";

// ── 섹션 래퍼 ──
export function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`px-4 ${className}`}>{children}</section>;
}

// ── 섹션 헤더 ──
export function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
      {children}
    </h2>
  );
}

// ── 구분선 ──
export function Divider() {
  return <div className="mx-4 my-6 h-px bg-zinc-200 dark:bg-zinc-800" />;
}

// ── 통계 칩 ──
export function StatChip({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 px-3 py-3 text-center">
      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium mb-0.5">
        {label}
      </p>
      <p className="text-lg font-bold tabular-nums text-zinc-900 dark:text-white">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

// ── 빈 상태 ──
export function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2">
      {icon || (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-200">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 15h8" />
          <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="9" r="1" fill="currentColor" stroke="none" />
        </svg>
      )}
      <p className="text-sm text-zinc-400">{message}</p>
    </div>
  );
}

// ── 분석 바 차트 섹션 ──
export function AnalyticsSection({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: number }[];
}) {
  let accent: string;
  try {
    const ctx = useAccent();
    accent = ctx.accent;
  } catch {
    accent = "#ec4899";
  }
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
                <span className="relative px-3 text-sm text-zinc-800 dark:text-zinc-200 leading-7 truncate block">
                  {item.label}
                </span>
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

// ── 앱 컨테이너 (430px 모바일 뷰) ──
export function AppShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto max-w-[430px] w-full h-dvh flex flex-col bg-white dark:bg-zinc-950 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 ${className}`}
    >
      {children}
    </div>
  );
}

// ── 하단 탭 버튼 ──
export function TabButton({
  active,
  onClick,
  icon,
  label,
  activeColor,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
        !active ? "text-zinc-300" : ""
      }`}
      style={active ? { color: activeColor } : undefined}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}
