"use client";

import { slugToColor } from "@/lib/site-color";

// ─── 공통 썸네일 ───────────────────────────────────────────────
interface SiteThumbnailProps {
  slug: string;
  name: string;
  ogImage?: string | null;
  color?: string | null;
  size?: "sm" | "md" | "lg";
}

export function SiteThumbnail({ slug, name, ogImage, color, size = "md" }: SiteThumbnailProps) {
  const bg = color || slugToColor(slug);
  const dim = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-12 h-12" : "w-10 h-10";
  const rounded = size === "lg" ? "rounded-xl" : "rounded-lg";

  if (ogImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={ogImage} alt="" className={`${dim} ${rounded} object-cover shrink-0`} />
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
  ogImage?: string | null;
  color?: string | null;
  description?: string | null;
  right?: React.ReactNode;
  onClick?: () => void;
  /** "bare" = 배경/패딩 없이 레이아웃만 (SiteHero 등에서 사용) */
  variant?: "card" | "bare";
  thumbnailSize?: "sm" | "md" | "lg";
}

export function SitePreviewCard({ slug, name, ogImage, color, description, right, onClick, variant = "card", thumbnailSize = "md" }: SitePreviewCardProps) {
  const base = variant === "bare"
    ? "flex items-center gap-3"
    : "flex items-center gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 px-3 py-3";

  const content = (
    <>
      <SiteThumbnail slug={slug} name={name} ogImage={ogImage} color={color} size={thumbnailSize} />
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
      <button onClick={onClick} className={`${base} w-full text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors`}>
        {content}
      </button>
    );
  }

  return <div className={base}>{content}</div>;
}
