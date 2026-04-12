"use client";

import { useState, useEffect } from "react";
import { Show, UserButton, useUser } from "@clerk/nextjs";
import { Watermark, AppShell, AppShellHeader, AppShellContent, Tab, TabBar, ThemeButton, ThemeDialog } from "@m1kapp/ui";
import { HomeTab } from "@/components/tabs/home-tab";
import { StoreTab } from "@/components/tabs/store-tab";
import { BadgeWorldTab } from "@/components/tabs/badge-world-tab";
import { MyTab } from "@/components/tabs/my-tab";
import type { RecentSite } from "@/lib/types";

export default function Home() {
  const [recentSites, setRecentSites] = useState<RecentSite[]>([]);
  const [mySites, setMySites] = useState<RecentSite[]>([]);
  const [selfSlug, setSelfSlug] = useState<string | null>(null);

  useEffect(() => {
    setSelfSlug(document.body.dataset.selfSlug || null);
  }, []);
  const [bgColor, setBgColor] = useState("#0f172a");
  const [themeOpen, setThemeOpen] = useState(false);
  const [tab, setTab] = useState<"home" | "store" | "badge" | "my">("home");
  const { isSignedIn, user } = useUser();
  const [sponsor, setSponsor] = useState<{ slug: string; name: string; is1k: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/sponsor")
      .then((r) => r.json())
      .then((d) => d && setSponsor(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/sites/recent")
      .then((res) => res.json())
      .then(setRecentSites)
      .catch(() => {});
  }, []);

  function fetchMySites() {
    fetch("/api/sites/mine")
      .then((res) => res.json())
      .then((data) => setMySites(Array.isArray(data) ? data : []))
      .catch(() => {});
  }

  useEffect(() => {
    if (tab === "my" && isSignedIn) {
      fetchMySites();
    }
  }, [tab, isSignedIn]);

  return (
    <>
    <Watermark color={bgColor} sponsor={sponsor ? { name: sponsor.is1k ? `🎉 ${sponsor.name}` : sponsor.name, url: `/${sponsor.slug}` } : undefined}>
      <AppShell className="m-0">
        <AppShellHeader>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter" style={{ color: bgColor }}>
              m1k
            </span>
            <Show when="signed-in">
              <UserButton appearance={{ elements: { avatarBox: "w-6 h-6" } }} />
            </Show>
          </div>
          <ThemeButton color={bgColor} onClick={() => setThemeOpen(true)} />
        </AppShellHeader>

        <AppShellContent>
          {tab === "home" ? (
            <HomeTab bgColor={bgColor} recentSites={recentSites} selfSlug={selfSlug} onStart={() => setTab("my")} />
          ) : tab === "store" ? (
            <StoreTab
              sites={recentSites}
              bgColor={bgColor}
              onRefreshItem={async (slug) => {
                await fetch("/api/sites/refresh-og", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ slug }),
                });
                const res = await fetch("/api/sites/recent");
                setRecentSites(await res.json());
              }}
            />
          ) : tab === "badge" ? (
            <BadgeWorldTab bgColor={bgColor} />
          ) : (
            <MyTab sites={mySites} isSignedIn={!!isSignedIn} bgColor={bgColor} onRegistered={fetchMySites} />
          )}
        </AppShellContent>

        {/* 하단 탭바 */}
        <TabBar>
          <Tab active={tab === "home"} onClick={() => setTab("home")} activeColor={bgColor} label="홈"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={tab === "home" ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l9-9 9 9" /><path d="M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10" /></svg>}
          />
          <Tab active={tab === "store"} onClick={() => setTab("store")} activeColor={bgColor} label="탐색"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={tab === "store" ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>}
          />
          <Tab active={tab === "badge"} onClick={() => setTab("badge")} activeColor={bgColor} label="배지 월드"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={tab === "badge" ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.77 4 4 0 0 1 0 6.76 4 4 0 0 1-4.78 4.77 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" /><path d="m9 12 2 2 4-4" /></svg>}
          />
          <Tab active={tab === "my"} onClick={() => setTab("my")} activeColor={bgColor} label="마이페이지"
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
