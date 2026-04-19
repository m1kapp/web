import { cookies } from "next/headers";
import { Watermark, AppShell, AppShellHeader, AppShellContent, Section, Divider } from "@m1kapp/kit";

export default async function Loading() {
  const cookieStore = await cookies();
  const isDark = (cookieStore.get("theme")?.value ?? "light") !== "light";

  const weeks = 20;
  const days = 7;

  return (
    <div className={isDark ? "dark" : ""}>
      <Watermark color="#0f172a">
        <AppShell>

          {/* 헤더 */}
          <header className="sticky top-0 z-20 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md h-14 shrink-0">
            <div className="flex items-center justify-between px-4 h-full">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                <div className="w-16 h-5 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
              </div>
              <div className="w-24 h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            </div>
          </header>

          <AppShellContent>

            {/* SiteHero */}
            <Section className="pt-6 pb-2">
              {/* 아이콘 + 이름 */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-36 h-5 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                  <div className="w-24 h-3 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                </div>
                <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              </div>

              {/* 달성 배지 행 */}
              <div className="flex flex-wrap gap-1 mb-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse"
                    style={{ animationDelay: `${i * 60}ms` }}
                  />
                ))}
              </div>

              {/* 숫자 + 게이지 */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <div className="w-14 h-8 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                    <div className="w-10 h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                  </div>
                  <div className="w-12 h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800" />
                <div className="flex justify-between px-0.5">
                  {["250", "500", "750", "1K"].map((m) => (
                    <span key={m} className="text-[9px] tabular-nums font-medium text-zinc-300 dark:text-zinc-700">{m}</span>
                  ))}
                </div>
              </div>
            </Section>

            {/* 통계 칩 4개 */}
            <Section className="flex gap-3 pt-5">
              {["연속", "이번 주", "이번 달", "전체"].map((label) => (
                <div key={label} className="flex-1 rounded-xl bg-zinc-50 dark:bg-zinc-900 py-3 px-2 text-center">
                  <p className="text-[10px] text-zinc-400 mb-1">{label}</p>
                  <div className="w-8 h-5 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse mx-auto" />
                </div>
              ))}
            </Section>

            {/* 부스트 버튼 */}
            <Section className="pt-3">
              <div className="h-10 w-full rounded-xl bg-zinc-50 dark:bg-zinc-900 animate-pulse" />
            </Section>

            <Divider />

            {/* 잔디맵 */}
            <Section>
              <svg width={weeks * 16 + 30} height={days * 16 + 20} className="overflow-x-auto">
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
            </Section>

            <Divider />

            {/* 분석 */}
            <Section className="space-y-5 pb-12">
              {["국가", "디바이스", "유입 경로"].map((title) => (
                <div key={title}>
                  <p className="text-xs font-semibold text-zinc-400 mb-2">{title}</p>
                  <div className="space-y-2">
                    {[80, 55, 35].map((w, i) => (
                      <div
                        key={i}
                        className="h-6 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse"
                        style={{ width: `${w}%`, animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </Section>

          </AppShellContent>
        </AppShell>
      </Watermark>
    </div>
  );
}
