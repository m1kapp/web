"use client";

import { useState } from "react";

interface SiteCardProps {
  slug: string;
  url?: string | null;
  title: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  color?: string | null;
  owner?: { name: string; imageUrl: string } | null;
  showDescription?: boolean;
  actions?: React.ReactNode;
}

const FALLBACK_COLORS = [
  "#ec4899", "#a855f7", "#3b82f6", "#22c55e", "#f97316", "#ef4444",
];

function slugToColor(slug: string): string {
  let hash = 0;
  for (const ch of slug) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
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
  showDescription = false,
  actions,
}: SiteCardProps) {
  const displayName = ogTitle || title || slug;
  const color = colorProp || slugToColor(slug);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2.5 hover:bg-zinc-100 transition-all active:scale-[0.98] relative">
      {/* 썸네일 — 소유자 아바타 오버레이 */}
      <a href={`/${slug}`} className="shrink-0 relative group">
        {ogImage ? (
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ogImage} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            <span className="text-xs font-black text-white/80">
              {displayName.slice(0, 2)}
            </span>
          </div>
        )}
        {/* 소유자 아바타 */}
        {owner ? (
          <div className="absolute -bottom-1 -right-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={owner.imageUrl}
              alt=""
              className="w-4.5 h-4.5 rounded-full border-2 border-white"
            />
            {/* 호버 툴팁 */}
            <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block">
              <div className="bg-zinc-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
                {owner.name}
              </div>
            </div>
          </div>
        ) : (
          /* 소유자 없음 — 작은 물음표 */
          <div className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full bg-zinc-300 border-2 border-white flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">?</span>
          </div>
        )}
      </a>

      {/* 정보 */}
      <a href={`/${slug}`} className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-800 truncate">
          {displayName}
        </p>
        {showDescription && ogDescription ? (
          <p className="text-[10px] text-zinc-400 truncate mt-0.5">
            {ogDescription}
          </p>
        ) : (
          <p className="text-[10px] text-zinc-400 truncate">
            {url || slug}
          </p>
        )}
      </a>

      {/* 배지 + 더보기 */}
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
                <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-lg shadow-lg border border-zinc-100 py-1 min-w-[120px]">
                  <div onClick={() => setShowMenu(false)}>
                    {actions}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
