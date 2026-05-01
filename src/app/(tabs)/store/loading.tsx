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
      <div className="space-y-0">
        {Array.from({ length: 5 }).map((_, i) => (
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
    </div>
  );
}
