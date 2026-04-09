"use client";

import { useState, useEffect, useCallback } from "react";
import { CodeSnippet } from "./code-snippet";
import { useAccent, ACCENT_COLORS, type AccentHex } from "@/lib/theme-context";
import type { SiteCounts } from "@/lib/achievements";

interface BadgeConfiguratorProps {
  slug: string;
  host: string;
  initialColor?: string;
  initialStyle?: string;
  initialLabel?: string;
  counts?: SiteCounts;
  isOwner?: boolean;
}

type BadgeStyle = "flat" | "flat-square" | "rounded" | "cyworld";

const STYLES: { value: BadgeStyle; label: string }[] = [
  { value: "flat", label: "Flat" },
  { value: "flat-square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "cyworld", label: "싸이월드" },
];

const COLORS = Object.entries(ACCENT_COLORS).map(([hex, meta]) => ({
  label: meta.name,
  value: hex as AccentHex,
}));

export function BadgeConfigurator({
  slug,
  host,
  initialColor,
  initialStyle,
  initialLabel,
  counts = { total: 0, weekly: 0, daily: 0 },
  isOwner = false,
}: BadgeConfiguratorProps) {
  const { accent, setAccent } = useAccent();
  const [label, setLabel] = useState(initialLabel || "m1k");
  const [color, setColor] = useState<AccentHex>(
    (initialColor as AccentHex) || accent
  );
  const [style, setStyle] = useState<BadgeStyle>(
    (initialStyle as BadgeStyle) || "flat"
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (color in ACCENT_COLORS) {
      setAccent(color);
    }
  }, [color, setAccent]);

  // 설정 저장
  const saveSettings = useCallback(async () => {
    await fetch("/api/sites/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        color,
        badgeStyle: style,
        badgeLabel: label,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [slug, color, style, label]);

  const params = new URLSearchParams();
  if (label !== "m1k") params.set("label", label);
  if (color !== "#ec4899") params.set("color", color.replace("#", ""));
  if (style !== "flat") params.set("style", style);
  const qs = params.toString() ? `?${params.toString()}` : "";

  const badgeUrl = `https://${host}/badge/${slug}.svg${qs}`;
  const dashboardUrl = `https://${host}/${slug}`;
  const markdownCode = `[![Hits](${badgeUrl})](${dashboardUrl})`;
  const htmlCode = `<a href="${dashboardUrl}"><img alt="Hits" src="${badgeUrl}"/></a>`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          배지 설정
        </h3>
        {isOwner && (
          <button
            onClick={saveSettings}
            className="text-[11px] font-semibold px-3 py-1 rounded-lg text-white transition-colors"
            style={{ backgroundColor: saved ? "#22c55e" : accent }}
          >
            {saved ? "저장됨!" : "저장"}
          </button>
        )}
      </div>

      {/* 프리뷰 */}
      <div className="flex items-center justify-center h-28 rounded-xl bg-zinc-100 dark:bg-zinc-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/badge/${slug}.svg${qs}`}
          alt="Badge preview"
          key={`${label}-${color}-${style}`}
        />
      </div>

      {/* 스타일 */}
      <div className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          {STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStyle(s.value)}
              className={`rounded-lg py-2 text-[11px] font-medium transition-colors ${
                style === s.value
                  ? "text-white"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              }`}
              style={
                style === s.value ? { backgroundColor: accent } : undefined
              }
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* 라벨 — cyworld에서는 숨김 */}
        {style !== "cyworld" && (
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="라벨"
            className="w-full rounded-lg bg-zinc-100 dark:bg-zinc-900 px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2"
            style={
              { "--tw-ring-color": "var(--accent-light)" } as React.CSSProperties
            }
          />
        )}

        {/* 컬러 */}
        <div className="flex items-center gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className="w-8 h-8 rounded-full transition-all hover:scale-110"
              style={{
                backgroundColor: c.value,
                boxShadow:
                  color === c.value
                    ? `0 0 0 2px var(--color-background, white), 0 0 0 4px ${c.value}`
                    : "none",
              }}
              title={c.label}
            />
          ))}
        </div>

      </div>

      {/* 코드 */}
      <div className="space-y-2">
        <CodeSnippet label="MARKDOWN" code={markdownCode} />
        <CodeSnippet label="HTML" code={htmlCode} />
        <CodeSnippet
          label="히든 (보이지 않게 카운트만)"
          code={`<img src="${badgeUrl}" style="display:none" alt=""/>`}
        />
        <CodeSnippet
          label="조회 전용 (카운트 X)"
          code={`${badgeUrl}${qs ? "&" : "?"}view=true`}
        />
      </div>
    </div>
  );
}
