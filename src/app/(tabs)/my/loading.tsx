import { SiteCardSkeleton } from "@/components/site-card";

export default function MyLoading() {
  return (
    <div className="px-4 pt-2 pb-24 animate-pulse">
      {/* 프로필 */}
      <div className="flex items-center gap-3 mb-5 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <div className="space-y-1.5">
            <div className="h-5 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-3 w-40 rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
        <div className="h-4 w-12 rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>

      {/* 섹션 탭 */}
      <div className="flex gap-1 mb-5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
        <div className="flex-1 py-1.5 rounded-lg bg-white dark:bg-zinc-950 h-8" />
        <div className="flex-1 py-1.5 rounded-lg h-8" />
      </div>

      {/* 사이트 카드 */}
      <div className="border-t border-zinc-200 dark:border-zinc-800" />
      <SiteCardSkeleton count={3} />
    </div>
  );
}
