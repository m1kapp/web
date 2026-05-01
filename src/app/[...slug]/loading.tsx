import { cookies } from "next/headers";
import { Watermark, AppShell, AppShellHeader, AppShellContent, Section, Divider } from "@m1kapp/kit";

export default async function Loading() {
  const cookieStore = await cookies();
  const isDark = (cookieStore.get("theme")?.value ?? "light") !== "light";

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
              <div className="w-24 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            </div>
          </header>

          <AppShellContent>

            {/* SiteHero — SitePreviewCard + 오너 + 히어로 숫자 */}
            <Section className="pt-4 pb-2">
              {/* SitePreviewCard */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="w-40 h-4 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                  <div className="w-56 h-3 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                </div>
              </div>

              {/* 오너 */}
              <div className="flex items-center justify-end gap-1.5 mt-2">
                <div className="w-12 h-3 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                <div className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                <div className="w-16 h-3 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              </div>

              {/* 히어로 숫자 */}
              <div className="mt-3">
                <div className="flex items-end gap-2">
                  <div className="w-20 h-9 rounded bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
                  <div className="w-16 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse mb-0.5" />
                  <div className="w-14 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse mb-0.5" />
                </div>
                <div className="w-48 h-3 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse mt-2" />
              </div>
            </Section>

            {/* 인증 상태 */}
            <Section className="pt-1 pb-3">
              <div className="w-16 h-4 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            </Section>

            {/* 부스트 버튼 */}
            <Section className="py-3">
              <div className="flex gap-2">
                <div className="flex-1 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                <div className="flex-1 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
              </div>
            </Section>

            {/* 섹션 탭 네비게이션 */}
            <Section className="py-2">
              <div className="flex gap-2 overflow-x-auto">
                {["누적", "데일리", "국가", "도시", "시간대", "디바이스", "브라우저", "유입"].map((label) => (
                  <div
                    key={label}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse"
                  >
                    <span className="text-[11px] text-transparent">{label}</span>
                  </div>
                ))}
              </div>
            </Section>

            <Divider />

            {/* 누적 곡선 */}
            <Section className="py-5">
              <div className="w-20 h-3 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse mb-3" />
              <div className="h-28 rounded-lg bg-zinc-50 dark:bg-zinc-900 animate-pulse" />
            </Section>

            <Divider />

            {/* 잔디맵 */}
            <Section className="py-5">
              <div className="w-24 h-3 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse mb-3" />
              <div className="h-28 rounded-lg bg-zinc-50 dark:bg-zinc-900 animate-pulse" />
            </Section>

            <Divider />

            {/* 분석 섹션 — 탭형 */}
            <Section className="py-3 space-y-4 pb-12">
              {["국가", "디바이스", "유입 경로"].map((title) => (
                <div key={title}>
                  <div className="w-16 h-3 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse mb-3" />
                  <div className="space-y-2">
                    {[75, 50, 30].map((w, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-14 h-3 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                        <div
                          className="h-5 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse"
                          style={{ width: `${w}%`, animationDelay: `${i * 100}ms` }}
                        />
                        <div className="w-8 h-3 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                      </div>
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
