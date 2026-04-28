"use client";

import { useState } from "react";
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
  const candidates = origin ? FAVICON_CANDIDATES(origin) : [];

  const cached = faviconCache.get(origin);
  const [faviconSrc, setFaviconSrc] = useState<string | null>(cached ?? candidates[0] ?? null);
  const [faviconStatus, setFaviconStatus] = useState<"loading" | "loaded" | "failed">(
    cached ? "loaded" : candidates.length > 0 ? "loading" : "failed"
  );

  const tryNext = (current: string) => {
    const idx = candidates.indexOf(current);
    const next = candidates[idx + 1] ?? null;
    if (next) {
      setFaviconSrc(next);
    } else {
      faviconCache.delete(origin);
      setFaviconSrc(null);
      setFaviconStatus("failed");
    }
  };

  return (
    <div className={`${dim} ${rounded} shrink-0 flex items-center justify-center overflow-hidden relative border border-transparent`}
      style={{ backgroundColor: faviconStatus === "failed" ? bg : "transparent", borderColor: faviconStatus !== "failed" ? "rgb(228 228 231)" : "transparent" }}>
      {/* 실패 시에만 글자 폴백 */}
      {faviconStatus === "failed" && (
        <span className={`${fontSize} font-black text-white/90`}>{name[0]?.toUpperCase()}</span>
      )}
      {faviconSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={faviconSrc} alt=""
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth < 8 || img.naturalHeight < 8) { tryNext(faviconSrc); return; }
            faviconCache.set(origin, faviconSrc);
            setFaviconStatus("loaded");
          }}
          onError={() => tryNext(faviconSrc)}
          className={`absolute inset-0 w-full h-full object-cover ${rounded} transition-opacity duration-150 ${faviconStatus === "loaded" ? "opacity-100" : "opacity-0"}`} />
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
