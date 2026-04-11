"use client";

import { createContext, useContext, useState, useEffect } from "react";

const ACCENT_COLORS = {
  "#ec4899": { name: "핑크", light: "236, 72, 153" },
  "#a855f7": { name: "퍼플", light: "168, 85, 247" },
  "#3b82f6": { name: "블루", light: "59, 130, 246" },
  "#22c55e": { name: "그린", light: "34, 197, 94" },
  "#f97316": { name: "오렌지", light: "249, 115, 22" },
  "#ef4444": { name: "레드", light: "239, 68, 68" },
  "#0f172a": { name: "네이비", light: "15, 23, 42" },
  "#18181b": { name: "블랙", light: "24, 24, 27" },
} as const;

export type AccentHex = keyof typeof ACCENT_COLORS;

interface AccentContextType {
  accent: AccentHex;
  setAccent: (color: AccentHex) => void;
  accentRgb: string;
  isDark: boolean;
}

const AccentContext = createContext<AccentContextType>({
  accent: "#ec4899",
  setAccent: () => {},
  accentRgb: "236, 72, 153",
  isDark: false,
});

function hexToLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  // relative luminance
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function AccentProvider({ initialAccent, children }: { initialAccent?: AccentHex; children: React.ReactNode }) {
  const [accent, setAccent] = useState<AccentHex>(initialAccent ?? "#ec4899");
  const accentRgb = ACCENT_COLORS[accent]?.light ?? "236, 72, 153";
  const [isDark, setIsDark] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.classList.contains("dark")
      : false
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <AccentContext.Provider value={{ accent, setAccent, accentRgb, isDark }}>
      <div
        className="min-h-dvh"
        style={{
          "--accent": `rgb(${accentRgb})`,
          "--accent-light": `rgba(${accentRgb}, 0.15)`,
          "--accent-subtle": `rgba(${accentRgb}, 0.08)`,
        } as React.CSSProperties}
      >
        {children}
      </div>
    </AccentContext.Provider>
  );
}

export function useAccent() {
  return useContext(AccentContext);
}

export { ACCENT_COLORS };
