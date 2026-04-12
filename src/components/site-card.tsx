"use client";

import { useState } from "react";
import { slugToColor } from "@/lib/site-color";
import { SiteThumbnail } from "./site-preview-card";

interface SiteCardProps {
  slug: string;
  url?: string | null;
  title: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  color?: string | null;
  owner?: { name: string; imageUrl: string } | null;
  actions?: React.ReactNode;
  /** 오른쪽 영역을 커스텀 슬롯으로 교체 (배지 숨김) */
  rightSlot?: React.ReactNode;
  /** 소유자 아바타 오버레이 숨김 */
  hideOwner?: boolean;
}

export function SiteCard({
  slug,
  url,
  title,
  ogTitle,
  ogDescription,
  ogImage,
  color: colorProp,
  owner,
  actions,
  rightSlot,
  hideOwner,
}: SiteCardProps) {
  const displayName = ogTitle || title || slug;
  const color = colorProp || slugToColor(slug);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2.5 hover:bg-zinc-100 transition-all active:scale-[0.98] relative">
      {/* 썸네일 + 소유자 아바타 오버레이 */}
      <a href={`/${slug}`} className="shrink-0 relative group">
        <SiteThumbnail slug={slug} name={displayName} ogImage={ogImage} color={color} />
        {!hideOwner && (owner ? (
          <div className="absolute -bottom-1 -right-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={owner.imageUrl} alt="" className="w-4.5 h-4.5 rounded-full border-2 border-white" />
            <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block">
              <div className="bg-zinc-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
                {owner.name}
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-zinc-300 border-2 border-white flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">?</span>
          </div>
        ))}
      </a>

      {/* 정보 */}
      <a href={`/${slug}`} className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-800 truncate" title={displayName}>
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/badge/${slug}.svg?view=true`} alt="" className="max-w-28" />
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
