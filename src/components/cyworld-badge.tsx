"use client";

const BADGE_FONT: React.CSSProperties = {
  fontFamily: "Verdana,Tahoma,sans-serif",
  fontSize: 9,
};

interface CyworldBadgeProps {
  label?: string;
  today: number | null;
  total: number | null;
  accent: string;
}

export function CyworldBadge({ label, today, total, accent }: CyworldBadgeProps) {
  return (
    <div
      className="inline-flex flex-col items-center gap-1 rounded-sm px-3 py-1 bg-white border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700"
      style={BADGE_FONT}
    >
      {label && (
        <span className="font-black tracking-tight text-zinc-400 uppercase">{label}</span>
      )}
      <div className="inline-flex items-center gap-2">
        <span className="text-zinc-400 tracking-tighter">TODAY</span>
        <strong style={{ color: accent }}>{today ?? "—"}</strong>
        <span className="text-zinc-400 tracking-tighter">TOTAL</span>
        <strong className="text-zinc-600 dark:text-zinc-300">{total ?? "—"}</strong>
      </div>
    </div>
  );
}
