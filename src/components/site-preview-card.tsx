"use client";

import { useState, useEffect } from "react";
import { slugToColor } from "@/lib/site-color";
import { extractDomain } from "@/lib/format";

// ─── 공통 썸네일 ───────────────────────────────────────────────
interface SiteThumbnailProps {
  slug: string;
  name: string;
  url?: string | null;
  color?: string | null;
  size?: "sm" | "md" | "lg";
}

const FAVICON_CANDIDATES = (origin: string) => [
  `${origin}/apple-touch-icon.png`,           // 180×180 — 최고화질
  `${origin}/apple-touch-icon-precomposed.png`,
  `${origin}/favicon-32.png`,
  `${origin}/favicon.ico`,
];

// 세션 캐시: origin → 성공한 favicon URL
const faviconCache = new Map<string, string>();

export function SiteThumbnail({ slug, name, url, color, size = "md" }: SiteThumbnailProps) {
  const bg = color || slugToColor(slug);
  const dim = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-12 h-12" : "w-10 h-10";
  const rounded = size === "lg" ? "rounded-xl" : "rounded-lg";
  const fontSize = size === "lg" ? "text-base" : "text-xs";

  const origin = (() => { try { return new URL(url!).origin; } catch { return ""; } })();

  // 캐시 히트 → 즉시 표시, 미스 → 병렬 시도 후 첫 성공
  const [faviconSrc, setFaviconSrc] = useState<string | null>(() => faviconCache.get(origin) ?? null);

  useEffect(() => {
    if (!origin || faviconCache.has(origin)) return;
    let cancelled = false;

    const tryNext = (candidates: string[]) => {
      if (cancelled || candidates.length === 0) return;
      const [candidate, ...rest] = candidates;
      const img = new Image();
      img.onload = () => {
        if (cancelled) return;
        if (img.naturalWidth < 8 || img.naturalHeight < 8) { tryNext(rest); return; }
        faviconCache.set(origin, candidate);
        setFaviconSrc(candidate);
      };
      img.onerror = () => { if (!cancelled) tryNext(rest); };
      img.src = candidate;
    };

    tryNext(FAVICON_CANDIDATES(origin));
    return () => { cancelled = true; };
  }, [origin]);

  return (
    <div className={`${dim} ${rounded} shrink-0 flex items-center justify-center overflow-hidden relative`} style={{ backgroundColor: bg }}>
      <span className={`${fontSize} font-black text-white/90`}>{name[0]?.toUpperCase()}</span>
      {faviconSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={faviconSrc} alt=""
          onError={() => { faviconCache.delete(origin); setFaviconSrc(null); }}
          className={`absolute inset-0 w-full h-full object-cover ${rounded}`} />
      )}
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
