"use client";

import { useState } from "react";
import { slugToColor } from "@/lib/site-color";
import { compactNumber } from "@/lib/format";
import { SiteThumbnail } from "./site-preview-card";

interface SiteCardProps {
  slug: string;
  url?: string | null;
  title: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  color?: string | null;
  actions?: React.ReactNode;
  /** 오른쪽 영역을 커스텀 슬롯으로 교체 (배지 숨김) */
  rightSlot?: React.ReactNode;
  /** 총 방문수 — 넘기면 배지 SVG 대신 숫자 표시 */
  total?: number;
  /** 오늘 방문수 */
  today?: number;
}

export function SiteCard({
  slug,
  url,
  title,
  ogTitle,
  ogDescription,
  ogImage,
  color: colorProp,
  actions,
  rightSlot,
  total,
  today,
}: SiteCardProps) {
  const displayName = ogTitle || title || slug;
  const color = colorProp || slugToColor(slug);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex items-center gap-3 py-1.5 transition-all active:scale-[0.98] relative">
      {/* 썸네일 + 소유자 아바타 오버레이 */}
      <a href={`/${slug}`} className="shrink-0">
        <SiteThumbnail slug={slug} name={displayName} url={url} color={color} />
      </a>

      {/* 정보 */}
      <a href={`/${slug}`} className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate" title={displayName}>
          {displayName}
        </p>
        <p className="text-[10px] text-zinc-400 truncate mt-0.5" title={ogDescription || url || slug}>
          {ogDescription || url || slug}
        </p>
      </a>

      {/* 오른쪽: rightSlot 우선, 없으면 배지 + 더보기 */}
      {rightSlot ? (
        <div className="shrink-0">{rightSlot}</div>
      ) : (
        <div className="shrink-0 flex items-center gap-1.5">
          {total != null ? (
            <div className="grid grid-cols-[auto_auto] gap-x-1 gap-y-0.5 items-baseline leading-snug">
              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 tracking-widest">TODAY</span>
              <span className="text-[10px] font-bold tabular-nums text-zinc-800 text-right dark:text-zinc-100">{compactNumber(Number(today ?? 0))}</span>
              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 tracking-widest">TOTAL</span>
              <span className="text-[10px] font-bold tabular-nums text-zinc-800 text-right dark:text-zinc-100">{compactNumber(Number(total))}</span>
            </div>
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={`/badge/${slug}.svg?view=true`} alt="" className="max-w-28" />
          )}
          {actions && (
            <div className="relative">
              <button
                onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}
                className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-zinc-200 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-zinc-100 py-1 min-w-30">
                    <div onClick={() => setShowMenu(false)}>{actions}</div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
