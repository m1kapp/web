"use client";

import { useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Show, UserButton, useUser } from "@clerk/nextjs";
import { Watermark, AppShell, AppShellHeader, AppShellContent, Tab, TabBar, ThemeButton, ThemeDialog } from "@m1kapp/kit";
import { useFetch } from "@m1kapp/kit";
import { ThemeProvider, useAppTheme } from "./theme-context";
import { useState, useEffect } from "react";

function TabsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
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

  return (
    <>
      <Watermark
        color={bgColor}
        sponsor={sponsor ? { name: sponsor.is1k ? `🎉 ${sponsor.name}` : sponsor.name, url: `/${sponsor.slug}` } : undefined}
      >
        <AppShell className="m-0">
          <AppShellHeader>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tighter" style={{ color: bgColor }}>m1k</span>
              <Show when="signed-in">
                <UserButton appearance={{ elements: { avatarBox: "w-6 h-6" } }} />
              </Show>
            </div>
            <ThemeButton color={bgColor} onClick={() => setThemeOpen(true)} />
          </AppShellHeader>

          <AppShellContent className="tab-scroll relative">
            {children}
          </AppShellContent>

          <TabBar>
            <Tab
              active={tab === "home"}
              onClick={() => router.push("/")}
              activeColor={bgColor}
              label="홈"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={tab === "home" ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l9-9 9 9" /><path d="M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10" /></svg>}
            />
            <Tab
              active={tab === "store"}
              onClick={() => router.push("/store")}
              activeColor={bgColor}
              label="앱"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={tab === "store" ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>}
            />
            <Tab
              active={tab === "builder"}
              onClick={() => router.push("/builder")}
              activeColor={bgColor}
              label="빌더"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={tab === "builder" ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>}
            />
            <Tab
              active={tab === "my"}
              onClick={() => router.push("/my")}
              activeColor={bgColor}
              label="프로필"
              icon={user?.imageUrl
                ? <img src={user.imageUrl} alt="" className={`w-5 h-5 rounded-full object-cover transition-all ${tab === "my" ? "ring-2 ring-offset-1" : "opacity-70"}`} style={{ "--tw-ring-color": bgColor } as React.CSSProperties} />
                : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={tab === "my" ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
            />
          </TabBar>
        </AppShell>
      </Watermark>

      <ThemeDialog
        open={themeOpen}
        onClose={() => setThemeOpen(false)}
        current={bgColor}
        onSelect={setBgColor}
      />
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
