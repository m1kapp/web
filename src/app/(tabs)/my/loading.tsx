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
      <div className="space-y-0">
        {Array.from({ length: 3 }).map((_, i) => (
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
