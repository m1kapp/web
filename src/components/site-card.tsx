"use client";

import { slugToColor } from "@/lib/site-color";
import { compactNumber } from "@/lib/format";
import { SiteThumbnail } from "./site-preview-card";
import type { RecentSite } from "@/lib/types";

interface SiteCardProps {
  site: RecentSite;
  /** 오른쪽 영역을 커스텀 슬롯으로 교체 */
  rightSlot?: React.ReactNode;
}

export function SiteCard({ site, rightSlot }: SiteCardProps) {
  const { slug, url, title, ogTitle, ogDescription, faviconUrl, color: colorProp, total, today } = site;
  const displayName = ogTitle || title || slug;
  const color = colorProp || slugToColor(slug);

  return (
    <div className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all active:scale-[0.98] relative">
      <a href={`/${slug}`} className="shrink-0">
        <SiteThumbnail slug={slug} name={displayName} faviconUrl={faviconUrl} color={color} />
      </a>

      <a href={`/${slug}`} className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate" title={displayName}>
          {displayName}
        </p>
        <p className="text-[10px] text-zinc-400 truncate mt-0.5" title={ogDescription || url || slug}>
          {ogDescription || url || slug}
        </p>
      </a>

      {rightSlot ? (
        <div className="shrink-0">{rightSlot}</div>
      ) : total != null ? (
        <div className="shrink-0 w-[84px] space-y-0.5 leading-snug">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 tracking-widest">TODAY</span>
            <span className="min-w-[24px] text-[10px] font-bold tabular-nums text-zinc-800 text-right dark:text-zinc-100">{compactNumber(Number(today ?? 0))}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 tracking-widest">TOTAL</span>
            <span className="min-w-[24px] text-[10px] font-bold tabular-nums text-zinc-800 text-right dark:text-zinc-100">{compactNumber(Number(total))}</span>
          </div>
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={`/badge/${slug}.svg?view=true`} alt="" className="shrink-0 max-w-28" />
      )}
    </div>
  );
}

export function SiteCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-0 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-3.5 w-2/3 rounded bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-2.5 w-1/2 rounded bg-zinc-50 dark:bg-zinc-800/50" />
          </div>
          <div className="shrink-0 space-y-1 w-[84px]">
            <div className="flex items-center justify-between">
              <div className="h-2 w-8 rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-2.5 w-6 rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
            <div className="flex items-center justify-between">
              <div className="h-2 w-8 rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-2.5 w-6 rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
