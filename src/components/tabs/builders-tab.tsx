"use client";

import { useFetch } from "@m1kapp/kit";
import type { Builder } from "@/app/api/builders/route";
import { SiteThumbnail } from "@/components/site-preview-card";
import { Avatar } from "@/components/avatar";
import { useRouter } from "next/navigation";


function BuilderCard({ builder }: { builder: Builder }) {
  const router = useRouter();
  const displayName = builder.name || builder.handle || "익명 빌더";
  const topSites = builder.sites.slice(0, 3);

  return (
    <div
      onClick={() => builder.handle && router.push(`/@${builder.handle}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && builder.handle && router.push(`/@${builder.handle}`)}
      className="py-4 px-4 border-b border-zinc-200 dark:border-zinc-800 last:border-0 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors active:bg-zinc-100 dark:active:bg-zinc-800"
    >
      {/* 빌더 프로필 */}
      <div className="flex items-center gap-3 mb-3 w-full text-left">
        <Avatar imageUrl={builder.imageUrl} name={displayName} size={40} ring={false} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{displayName}</p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
            앱 {builder.siteCount}개 · 방문자 {builder.totalHits.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 앱 아이콘 목록 */}
      <div className="flex gap-3 overflow-x-auto pb-0.5 pl-[49px]">
        {topSites.map((site) => (
          <div
            key={site.slug}
            onClick={(e) => { e.stopPropagation(); router.push(`/${site.slug}`); }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); router.push(`/${site.slug}`); } }}
            className="shrink-0 flex flex-col items-center gap-1 w-[56px] group"
          >
            <SiteThumbnail
              slug={site.slug}
              name={site.ogTitle || site.title || site.slug}
              faviconUrl={site.faviconUrl}
              color={site.color}
              size="lg"
            />
            <p className="text-[9px] text-zinc-400 dark:text-zinc-500 truncate w-full text-center leading-tight">
              {site.ogTitle || site.title || site.slug}
            </p>
          </div>
        ))}
        {builder.siteCount > 3 && (
          <div className="shrink-0 w-[56px] flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <span className="text-[11px] font-semibold text-zinc-400">+{builder.siteCount - 3}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BuilderCardSkeleton() {
  return (
    <div className="py-4 px-4 border-b border-zinc-200 dark:border-zinc-800 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-2.5 w-32 rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>
      <div className="flex gap-3 pl-[49px]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="shrink-0 flex flex-col items-center gap-1 w-[56px]">
            <div className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-700" />
            <div className="w-10 h-2 rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BuildersTab({ bgColor }: { bgColor: string }) {
  const { data: builders, loading } = useFetch<Builder[]>("/api/builders");

  return (
    <div className="py-0">
      {loading && (
        <div>{[0, 1, 2, 3, 4].map((i) => <BuilderCardSkeleton key={i} />)}</div>
      )}
      {!loading && builders?.length === 0 && (
        <p className="text-sm text-zinc-400 text-center py-12">아직 빌더가 없어요</p>
      )}
      {!loading && builders && builders.length > 0 && (
        <div>{builders.map((b) => <BuilderCard key={b.userId} builder={b} />)}</div>
      )}
    </div>
  );
}
