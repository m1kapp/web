"use client";

import { relativeTime } from "@m1kapp/kit";
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
        // 사흘 안에 올라온 건 따로 표시한다 — "새로 등록"이라 해놓고 한 달 전 것만 있으면 말이 안 된다
        const age = Date.now() - time(site.createdAt);
        const isFresh = age < 3 * 24 * 60 * 60 * 1000;
        return (
          <div
            key={site.slug}
            className="flex items-center gap-3 rounded-2xl border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
          >
            {/* 카드 본문은 m1k 안의 사이트 상세로 — 방문 추이를 보는 자리 */}
            <a href={`/${site.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
              <SiteThumbnail
                slug={site.slug}
                name={name}
                faviconUrl={site.faviconUrl}
                color={site.color || slugToColor(site.slug)}
                size="lg"
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-bold text-zinc-900 dark:text-white" title={name}>
                    {name}
                  </span>
                  {isFresh && (
                    <span
                      className="shrink-0 rounded px-1 py-px text-[8px] font-black tracking-wider text-white"
                      style={{ backgroundColor: bgColor }}
                    >
                      NEW
                    </span>
                  )}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-[10px] leading-snug text-zinc-400" title={desc}>
                  {desc}
                </span>
                {site.createdAt && (
                  <span className="mt-1 block text-[9px] text-zinc-400">
                    {relativeTime(site.createdAt)} 등록
                  </span>
                )}
              </span>
            </a>

            {/* "열기"는 말 그대로 그 사이트를 연다 — 남의 사이트라 새 탭으로 */}
            {site.url ? (
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold text-white"
                style={{ backgroundColor: bgColor }}
              >
                열기
              </a>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
