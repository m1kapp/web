"use client";

import { useState } from "react";
import { slugToColor } from "@/lib/site-color";
import { extractDomain } from "@/lib/format";

function faviconUrl(url: string): string {
  const domain = extractDomain(url);
  if (!domain || domain === url) return "";
  return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=64`;
}

// ─── 공통 썸네일 ───────────────────────────────────────────────
interface SiteThumbnailProps {
  slug: string;
  name: string;
  /** 사이트 원본 URL — 있으면 파비콘을 우선 표시 */
  url?: string | null;
  color?: string | null;
  size?: "sm" | "md" | "lg";
}

export function SiteThumbnail({ slug, name, url, color, size = "md" }: SiteThumbnailProps) {
  const bg = color || slugToColor(slug);
  const dim = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-12 h-12" : "w-10 h-10";
  const rounded = size === "lg" ? "rounded-xl" : "rounded-lg";
  const [failed, setFailed] = useState(false);

  const favicon = url ? faviconUrl(url) : "";

  if (favicon && !failed) {
    return (
      <div className={`${dim} ${rounded} shrink-0 flex items-center justify-center`} style={{ backgroundColor: bg }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={favicon}
          alt=""
          className="w-5 h-5 object-contain"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }
  return (
    <div className={`${dim} ${rounded} shrink-0 flex items-center justify-center`} style={{ backgroundColor: bg }}>
      <span className="text-xs font-black text-white/80">{name.slice(0, 2)}</span>
    </div>
  );
}

// ─── 링크 프리뷰 카드 ──────────────────────────────────────────
interface SitePreviewCardProps {
  slug: string;
  name: string;
  url?: string | null;
  ogImage?: string | null;
  color?: string | null;
  description?: string | null;
  right?: React.ReactNode;
  onClick?: () => void;
  /** "bare" = 배경/패딩 없이 레이아웃만 (SiteHero 등에서 사용) */
  variant?: "card" | "bare";
  thumbnailSize?: "sm" | "md" | "lg";
}

export function SitePreviewCard({ slug, name, url, color, description, right, onClick, variant = "card", thumbnailSize = "md" }: SitePreviewCardProps) {
  const base = variant === "bare"
    ? "flex items-center gap-3"
    : "flex items-center gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 px-3 py-3";

  const content = (
    <>
      <SiteThumbnail slug={slug} name={name} url={url} color={color} size={thumbnailSize} />
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-zinc-900 dark:text-white truncate ${thumbnailSize === "lg" ? "text-base" : "text-sm"}`}>{name}</p>
        {description && (
          <p className="text-[11px] text-zinc-400 truncate mt-0.5">{description}</p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </>
  );

  if (onClick) {
    return (
      <div onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onClick()} className={`${base} w-full cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors`}>
        {content}
      </div>
    );
  }

  return <div className={base}>{content}</div>;
}
