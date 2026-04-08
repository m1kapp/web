"use client";

import { useAccent } from "@/lib/theme-context";

export function Watermark({ children, color }: { children: React.ReactNode; color?: string }) {
  let accent: string;
  try {
    const ctx = useAccent();
    accent = color ?? ctx.accent;
  } catch {
    accent = color ?? "#ec4899";
  }

  const rows = 20;
  const cols = 20;

  return (
    <div
      className="min-h-dvh w-full relative overflow-hidden"
      style={{ backgroundColor: accent }}
    >
      {/* 워터마크 — 200vw x 200vh 확보 후 회전 */}
      <div
        className="absolute pointer-events-none select-none"
        style={{
          top: "-50vh",
          left: "-50vw",
          width: "200vw",
          height: "200vh",
          transform: "rotate(-12deg)",
        }}
      >
        {Array.from({ length: rows }).map((_, row) => (
          <div
            key={row}
            className="flex whitespace-nowrap"
            style={{ marginLeft: row % 2 === 0 ? 0 : -80 }}
          >
            {Array.from({ length: cols }).map((_, col) => (
              <span
                key={col}
                className="inline-block text-[44px] font-black tracking-tight text-white/20 px-10 py-6"
              >
                m1k
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* 콘텐츠 */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
