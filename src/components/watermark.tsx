"use client";

import { useAccent } from "@/lib/theme-context";

function buildSvgPattern(opacity: number = 0.08): string {
  // 타일 하나: "m1k" 텍스트 2개 (엇갈림 배치)
  const w = 220;
  const h = 120;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <text x="10" y="45" font-family="system-ui,sans-serif" font-size="44" font-weight="900" fill="white" opacity="${opacity}">m1k</text>
    <text x="120" y="100" font-family="system-ui,sans-serif" font-size="44" font-weight="900" fill="white" opacity="${opacity}">m1k</text>
  </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export function Watermark({ children, color }: { children: React.ReactNode; color?: string }) {
  let accent: string;
  try {
    const ctx = useAccent();
    accent = color ?? ctx.accent;
  } catch {
    accent = color ?? "#ec4899";
  }

  return (
    <div
      className="h-dvh w-full relative overflow-hidden"
      style={{ backgroundColor: accent, transition: "background-color 0.5s ease" }}
    >
      {/* 워터마크 — CSS background-repeat로 무한 타일링 */}
      <div
        className="absolute inset-0 pointer-events-none select-none"
        style={{
          backgroundImage: buildSvgPattern(),
          backgroundRepeat: "repeat",
          transform: "rotate(-12deg) scale(1.5)",
          transformOrigin: "center center",
        }}
      />

      {/* 콘텐츠 */}
      <div className="relative z-10 h-full flex items-center justify-center p-3 mx-auto max-w-107.5">
        {children}
      </div>
    </div>
  );
}
