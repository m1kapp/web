"use client";

import { slugToColor } from "@/lib/site-color";
import { Avatar } from "./avatar";

// ─── 공통 썸네일 ───────────────────────────────────────────────
interface SiteThumbnailProps {
  slug: string;
  name: string;
  faviconUrl?: string | null;  // DB에 저장된 favicon URL (있으면 바로 사용)
  color?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
}

export function SiteThumbnail({ slug, name, faviconUrl, color, size = "md" }: SiteThumbnailProps) {
  const bg = color || slugToColor(slug);
  const dim = size === "xs" ? 28 : size === "sm" ? 32 : size === "lg" ? 48 : 40;
  const roundedClass = size === "lg" ? "rounded-xl" : "rounded-lg";

  return (
    <Avatar
      imageUrl={faviconUrl ?? undefined}
      name={name}
      size={dim}
      ring={false}
      rounded={roundedClass}
      bg={bg}
    />
  );
}

// ─── 링크 프리뷰 카드 ──────────────────────────────────────────
interface SitePreviewCardProps {
  slug: string;
  name: string;
  faviconUrl?: string | null;
  color?: string | null;
  description?: string | null;
  right?: React.ReactNode;
  onClick?: () => void;
  /** "bare" = 배경/패딩 없이 레이아웃만 (SiteHero 등에서 사용) */
  variant?: "card" | "bare";
  thumbnailSize?: "sm" | "md" | "lg";
}

export function SitePreviewCard({ slug, name, faviconUrl, color, description, right, onClick, variant = "card", thumbnailSize = "md" }: SitePreviewCardProps) {
  const base = variant === "bare"
    ? "flex items-center gap-3"
    : "flex items-center gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 px-3 py-3";

  const content = (
    <>
      <SiteThumbnail slug={slug} name={name} faviconUrl={faviconUrl} color={color} size={thumbnailSize} />
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
