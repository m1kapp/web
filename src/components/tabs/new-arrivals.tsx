"use client";

import { slugToColor } from "@/lib/site-color";
import { SiteThumbnail } from "@/components/site-preview-card";
import type { RecentSite } from "@/lib/types";

/**
 * 새로 등록된 앱 — 앱스토어의 "새로운 앱" 자리.
 *
 * 리그 목록은 누적 방문 순이라 갓 등록한 사이트는 늘 맨 아래로 밀린다.
 * 방금 합류한 사람의 것을 한 번은 눈에 띄게 놓아주려는 섹션이다.
 */
export function NewArrivals({ sites, bgColor }: { sites: RecentSite[]; bgColor: string }) {
  // createdAt은 서버에선 Date, fetch를 거치면 string으로 온다 — 숫자로 눌러서 비교한다
  const time = (v: RecentSite["createdAt"]) => (v ? new Date(v).getTime() : 0);
  const newest = [...sites]
    .filter((s) => s.createdAt)
    .sort((a, b) => time(b.createdAt) - time(a.createdAt))
    .slice(0, 3);

  if (!newest.length) return null;

  return (
    <div className="space-y-2">
      {newest.map((site) => {
        const name = site.ogTitle || site.title || site.slug;
        const desc = site.ogDescription || site.url || site.slug;
        return (
          <a
            key={site.slug}
            href={`/${site.slug}`}
            className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
          >
            <SiteThumbnail
              slug={site.slug}
              name={name}
              faviconUrl={site.faviconUrl}
              color={site.color || slugToColor(site.slug)}
              size="lg"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-zinc-900 dark:text-white" title={name}>
                {name}
              </p>
              <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-zinc-400" title={desc}>
                {desc}
              </p>
            </div>

            <span
              className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold text-white"
              style={{ backgroundColor: bgColor }}
            >
              열기
            </span>
          </a>
        );
      })}
    </div>
  );
}
