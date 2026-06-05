"use client";

import { useState, useCallback } from "react";
import { useAccent } from "@/lib/theme-context";
import { Section } from "@m1kapp/kit";
import { useCopy } from "@m1kapp/kit";

type BadgeStyle = "flat" | "flat-square" | "rounded" | "cyworld";
type SnippetFormat = "markdown" | "html";

const STYLES: { id: BadgeStyle; label: string }[] = [
  { id: "cyworld", label: "Cyworld" },
  { id: "flat", label: "Flat" },
  { id: "flat-square", label: "Square" },
  { id: "rounded", label: "Rounded" },
];

const COLORS = [
  { value: "000000", label: "Black" },
  { value: "ec4899", label: "Pink" },
  { value: "8b5cf6", label: "Purple" },
  { value: "3b82f6", label: "Blue" },
  { value: "10b981", label: "Green" },
  { value: "f97316", label: "Orange" },
  { value: "ef4444", label: "Red" },
  { value: "555555", label: "Gray" },
];

function buildBadgeUrl(host: string, slug: string) {
  return `https://${host}/badge/${slug}.svg`;
}

function buildPreviewUrl(slug: string, style: BadgeStyle, color: string) {
  return `/badge/${slug}.svg?style=${style}&color=${color}&view=true`;
}

function buildSnippet(format: SnippetFormat, badgeUrl: string, dashboardUrl: string) {
  if (format === "html") {
    return `<a href="${dashboardUrl}">\n  <img\n    src="${badgeUrl}"\n    alt="Hits"\n  />\n</a>`;
  }
  return `[![Hits](${badgeUrl})](${dashboardUrl})`;
}

interface BadgeEditorProps {
  slug: string;
  host: string;
  pending?: boolean;
  savedStyle?: string | null;
  savedColor?: string | null;
}

export function BadgeEditor({ slug, host, pending = false, savedStyle, savedColor }: BadgeEditorProps) {
  const { accent } = useAccent();
  const { copied, copy } = useCopy();
  const [style, setStyle] = useState<BadgeStyle>((savedStyle as BadgeStyle) || "cyworld");
  const [color, setColor] = useState(savedColor || "000000");
  const [customColor, setCustomColor] = useState("");
  const [format, setFormat] = useState<SnippetFormat>("html");

  const save = useCallback(async (newStyle: BadgeStyle, newColor: string) => {
    try {
      await fetch("/api/sites/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, badgeStyle: newStyle, badgeColor: newColor, color: `#${newColor}` }),
      });
    } catch {}
  }, [slug]);

  const handleStyleChange = (s: BadgeStyle) => {
    setStyle(s);
    save(s, color);
  };

  const handleColorChange = (c: string) => {
    setColor(c);
    save(style, c);
  };

  const badgeUrl = buildBadgeUrl(host, slug);
  const previewUrl = buildPreviewUrl(slug, style, color);
  const dashboardUrl = `https://${host}/${slug}`;
  const snippet = buildSnippet(format, badgeUrl, dashboardUrl);

  return (
    <Section className="pb-1">
      <div
        className={`rounded-xl p-4 ${pending ? "border border-zinc-200 dark:border-zinc-800" : "border border-zinc-200 dark:border-zinc-800"}`}
      >
        {pending && (
          <div className="mb-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">
              뱃지를 사이트에 심어주세요
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              코드를 붙여넣으면 인증 완료, 탐색 목록에 노출돼요
            </p>
          </div>
        )}

        {/* 미리보기 */}
        <div className="flex items-center justify-center py-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="badge preview"
            className="max-h-8"
          />
        </div>

        {/* 스타일 + 색상 */}
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mb-1.5">스타일</p>
            <div className="flex gap-1.5">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleStyleChange(s.id)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-colors ${
                    style === s.id
                      ? "text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  }`}
                  style={style === s.id ? { backgroundColor: accent } : undefined}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mb-1.5">색상</p>
            <div className="flex items-center gap-2.5">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => handleColorChange(c.value)}
                  className={`w-6 h-6 rounded-full transition-all ${
                    color === c.value ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950" : ""
                  }`}
                  style={{ backgroundColor: `#${c.value}` }}
                  title={c.label}
                />
              ))}
              {/* 커스텀 색상 */}
              <label
                className={`w-6 h-6 rounded-full border-2 border-dashed border-zinc-300 dark:border-zinc-600 cursor-pointer flex items-center justify-center overflow-hidden relative transition-all ${
                  !COLORS.some((c) => c.value === color) ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950" : ""
                }`}
                style={!COLORS.some((c) => c.value === color) ? { backgroundColor: `#${color}` } : undefined}
                title="커스텀 색상"
              >
                <input
                  type="color"
                  value={`#${customColor || color}`}
                  onChange={(e) => {
                    const hex = e.target.value.replace("#", "");
                    setCustomColor(hex);
                    handleColorChange(hex);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                {COLORS.some((c) => c.value === color) && (
                  <span className="text-[10px] text-zinc-400">+</span>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* 코드 스니펫 */}
        <div className="mt-4">
          <div className="flex gap-1 mb-1.5">
            {(["html", "markdown"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-colors ${
                  format === f
                    ? "text-zinc-900 dark:text-white bg-zinc-200 dark:bg-zinc-700"
                    : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {f === "markdown" ? "Markdown" : "HTML"}
              </button>
            ))}
          </div>
          <pre className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-3 text-[11px] text-zinc-700 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            {snippet}
          </pre>
        </div>

        {pending ? (
          <button
            onClick={() => copy(snippet)}
            className="w-full mt-4 py-2.5 rounded-lg text-xs font-semibold text-white transition-colors"
            style={{ backgroundColor: copied ? "#22c55e" : accent }}
          >
            {copied ? "복사됨!" : "코드 복사"}
          </button>
        ) : (
          <button
            onClick={() => { save(style, color); copy(snippet); }}
            className="w-full mt-4 py-2.5 rounded-lg text-xs font-semibold text-white transition-colors"
            style={{ backgroundColor: copied ? "#22c55e" : accent }}
          >
            {copied ? "저장됨!" : "저장"}
          </button>
        )}

        {pending && (
          <p className="text-[10px] text-zinc-400 text-center mt-2">
            방문자가 뱃지를 로드하면 자동으로 인증됩니다
          </p>
        )}
      </div>
    </Section>
  );
}
