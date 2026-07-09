import { SiteCardSkeleton } from "@/components/site-card";

export default function StoreLoading() {
  return (
    <div className="px-4 py-5 animate-pulse">
      {/* 헤더 */}
      <div className="mb-4">
        <div className="h-6 w-10 rounded bg-zinc-200 dark:bg-zinc-700 mb-1" />
        <div className="h-3 w-36 rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>

      {/* 검색 바 */}
      <div className="mb-3">
        <div className="h-10 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700" />
      </div>

      {/* 정렬 탭 */}
      <div className="flex gap-1.5 mb-4">
        <div className="h-7 w-16 rounded-lg bg-zinc-900 dark:bg-white" />
        <div className="h-7 w-20 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-7 w-16 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
      </div>

      {/* 사이트 카드 목록 */}
      <SiteCardSkeleton count={5} />
    </div>
  );
}
