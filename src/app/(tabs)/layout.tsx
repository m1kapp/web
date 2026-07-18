"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, UserButton, useUser } from "@clerk/nextjs";
import { Avatar } from "@/components/avatar";
import { Watermark, AppShell, AppShellHeader, AppShellContent, APP_SHELL_HEADER_HEIGHT, FetchProgress, Tab, TabBar, ThemeButton, ThemeDialog } from "@m1kapp/kit";
import { useFetch } from "@m1kapp/kit";
import { ThemeProvider, useAppTheme } from "./theme-context";
import { useState, useEffect } from "react";

// m1k.app 자체 사이트 등록 slug — 하단 powered-by 뱃지에 방문자 카운터 노출
const TRACK_SLUG = "gf";

// 하단 탭 정의 — icon은 활성 여부에 따른 strokeWidth를 받는다
const TAB_ITEMS: { id: string; href: string; label: string; icon: (sw: number) => React.ReactNode }[] = [
  {
    id: "home", href: "/", label: "홈",
    icon: (sw) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l9-9 9 9" /><path d="M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10" /></svg>,
  },
  {
    id: "store", href: "/store", label: "앱",
    icon: (sw) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
  },
  {
    id: "builder", href: "/builder", label: "빌더",
    icon: (sw) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3" /><path d="M7 21a5 5 0 0 1 10 0" /><circle cx="5" cy="10" r="2.5" /><path d="M2 21a3 3 0 0 1 6 0" /><circle cx="19" cy="10" r="2.5" /><path d="M16 21a3 3 0 0 1 6 0" /></svg>,
  },
  {
    id: "connect", href: "/connect", label: "연결",
    icon: (sw) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M9 17H7A5 5 0 0 1 7 7h2" /><path d="M15 7h2a5 5 0 0 1 0 10h-2" /><line x1="8" y1="12" x2="16" y2="12" /></svg>,
  },
  {
    id: "my", href: "/my", label: "프로필",
    icon: (sw) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  },
];

function TabsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const { bgColor, setBgColor } = useAppTheme();
  const [themeOpen, setThemeOpen] = useState(false);
  const scrollRef = useRef<HTMLElement | null>(null);

  const { data: sponsor } = useFetch<{ slug: string; name: string; is1k: boolean } | null>("/api/sponsor");

  useEffect(() => {
    // Cache the scroll container ref once on mount
    if (!scrollRef.current) {
      scrollRef.current = document.querySelector<HTMLElement>(".tab-scroll");
    }
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  const tab = pathname === "/" ? "home" : pathname.slice(1).split("/")[0];

  const headerTitle: Record<string, string> = {
    store: "앱",
    builder: "빌더",
  };

  return (
    <>
      <Watermark
        color={bgColor}
        sponsor={sponsor ? { name: sponsor.is1k ? `🎉 ${sponsor.name}` : sponsor.name, url: `/${sponsor.slug}` } : undefined}
        trackSlug={TRACK_SLUG}
        claimed
      >
        <AppShell className="m-0">
          <AppShellHeader>
            <div className="flex items-center gap-2">
              <span className={`font-black tracking-tighter ${headerTitle[tab] ? "text-lg" : "text-2xl"}`} style={{ color: headerTitle[tab] ? undefined : bgColor }}>
                {headerTitle[tab] ?? "m1k"}
              </span>
              <Show when="signed-in">
                <UserButton appearance={{ elements: { avatarBox: "w-6 h-6" } }} />
              </Show>
            </div>
            <ThemeButton color={bgColor} onClick={() => setThemeOpen(true)} />
          </AppShellHeader>

          {/* 백그라운드 갱신 인디케이터 — 헤더 바로 아래(세이프에어리어 포함 높이) */}
          <FetchProgress color={bgColor} top={APP_SHELL_HEADER_HEIGHT} />

          <AppShellContent className="tab-scroll relative">
            {children}
          </AppShellContent>

          <TabBar>
            {TAB_ITEMS.map((t) => {
              const active = tab === t.id;
              const icon = t.id === "my" && user
                ? <Avatar imageUrl={user.imageUrl} name={user.firstName || user.username || "?"} size={20} ring={false} className={`transition-all ${active ? "ring-2 ring-offset-1" : "opacity-70"}`} style={{ "--tw-ring-color": bgColor } as React.CSSProperties} />
                : t.icon(active ? 2.5 : 2);
              return (
                <Tab
                  key={t.id}
                  active={active}
                  render={(p) => <Link href={t.href} prefetch {...p} />}
                  activeColor={bgColor}
                  label={t.label}
                  icon={icon}
                />
              );
            })}
          </TabBar>
          <ThemeDialog
            open={themeOpen}
            onClose={() => setThemeOpen(false)}
            current={bgColor}
            onSelect={setBgColor}
          />
        </AppShell>
      </Watermark>
    </>
  );
}

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TabsShell>{children}</TabsShell>
    </ThemeProvider>
  );
}
