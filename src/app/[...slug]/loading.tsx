export default function Loading() {
  // 잔디맵 스켈레톤 — 빈 셀 그리드
  const weeks = 20;
  const days = 7;

  return (
    <div className="mx-auto max-w-[430px] w-full h-dvh flex flex-col border-x border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 shadow-sm">
      {/* 헤더 */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
            <div className="w-12 h-5 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
          </div>
          <div className="w-28 h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* 히어로 */}
        <section className="px-4 pt-6 pb-2">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="w-40 h-5 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
              <div className="w-24 h-3 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            </div>
          </div>

          {/* 배지 스켈레톤 */}
          <div className="flex gap-1 mb-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>

          {/* 게이지바 */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="w-20 h-8 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
              <div className="w-10 h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
            <div className="flex justify-between px-0.5">
              {["250", "500", "750", "1K"].map((m) => (
                <span key={m} className="text-[9px] tabular-nums font-medium text-zinc-300 dark:text-zinc-700">{m}</span>
              ))}
            </div>
          </div>
        </section>

        {/* 통계 칩 */}
        <section className="px-4 flex gap-3 pt-5">
          {["이번 주", "이번 달", "전체"].map((label) => (
            <div key={label} className="flex-1 rounded-xl bg-zinc-50 dark:bg-zinc-900 py-3 px-3 text-center">
              <p className="text-[10px] text-zinc-400 mb-1">{label}</p>
              <div className="w-8 h-5 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse mx-auto" />
            </div>
          ))}
        </section>

        <div className="mx-4 my-6 h-px bg-zinc-200 dark:bg-zinc-800" />

        {/* 잔디맵 스켈레톤 */}
        <section className="px-4">
          <div className="overflow-x-auto">
            <svg width={weeks * 16 + 30} height={days * 16 + 20}>
              {Array.from({ length: weeks }).map((_, w) =>
                Array.from({ length: days }).map((_, d) => (
                  <rect
                    key={`${w}-${d}`}
                    x={w * 16 + 30}
                    y={d * 16 + 15}
                    width={13}
                    height={13}
                    rx={3}
                    className="fill-zinc-100 dark:fill-zinc-800"
                  />
                ))
              )}
            </svg>
          </div>
        </section>

        <div className="mx-4 my-6 h-px bg-zinc-200 dark:bg-zinc-800" />

        {/* 분석 스켈레톤 */}
        <section className="px-4 space-y-5 pb-12">
          {["국가", "디바이스", "유입 경로"].map((title) => (
            <div key={title}>
              <p className="text-xs font-semibold text-zinc-400 mb-2">{title}</p>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-6 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" style={{ width: `${90 - i * 20}%`, animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
