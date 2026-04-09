"use client";

import { useState, useEffect, useRef } from "react";
import { Show, UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { GoogleLoginButton } from "@/components/google-login-button";
import { Watermark, AppShell, Tab, TabBar } from "@m1kapp/ui";
import { HomeTab } from "@/components/tabs/home-tab";
import { StoreTab } from "@/components/tabs/store-tab";
import { BadgeWorldTab } from "@/components/tabs/badge-world-tab";
import { MyTab } from "@/components/tabs/my-tab";
import type { RecentSite } from "@/lib/types";

const BG_COLORS = [
  "#ec4899", "#a855f7", "#3b82f6", "#22c55e", "#f97316", "#ef4444", "#0f172a", "#18181b",
];

export default function Home() {
  const [recentSites, setRecentSites] = useState<RecentSite[]>([]);
  const [mySites, setMySites] = useState<RecentSite[]>([]);
  const [bgColor, setBgColor] = useState("#0f172a");
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"home" | "store" | "badge" | "my">("home");

  // 바깥 클릭 시 컬러 피커 닫기
  useEffect(() => {
    if (!colorPickerOpen) return;
    function handleClick(e: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setColorPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [colorPickerOpen]);
  const { isSignedIn } = useUser();

  useEffect(() => {
    fetch("/api/sites/recent")
      .then((res) => res.json())
      .then(setRecentSites)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === "my" && isSignedIn) {
      fetchMySites();
    }
  }, [tab, isSignedIn]);

  function fetchMySites() {
    fetch("/api/sites/mine")
      .then((res) => res.json())
      .then((data) => setMySites(Array.isArray(data) ? data : []))
      .catch(() => {});
  }

  return (
    <Watermark color={bgColor}>
      <AppShell className="m-0">
        {/* 헤더 */}
        <header className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between border-b border-zinc-100 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md rounded-t-2xl">
          {/* 좌측 — m1k 로고 */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter" style={{ color: bgColor }}>
              m1k
            </span>
            <Show when="signed-in">
              <UserButton appearance={{ elements: { avatarBox: "w-6 h-6" } }} />
            </Show>
            <Show when="signed-out">
              <GoogleLoginButton
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md border border-zinc-200 text-zinc-400 hover:bg-zinc-50 transition-colors"
              />
            </Show>
          </div>

          {/* 우측 — 테마 색 버튼 */}
          <div className="relative flex items-center" ref={colorPickerRef}>
            <button
              onClick={() => setColorPickerOpen(!colorPickerOpen)}
              className="w-6 h-6 rounded-full transition-all hover:scale-110 ring-2 ring-white"
              style={{ backgroundColor: bgColor }}
            />
            {/* 컬러 피커 드롭다운 */}
            {colorPickerOpen && (
              <div className="absolute right-0 top-full mt-2 p-2 rounded-xl bg-white dark:bg-zinc-900 shadow-xl ring-1 ring-black/10 flex gap-1.5 z-50">
                {BG_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setBgColor(c); setColorPickerOpen(false); }}
                    className="w-7 h-7 rounded-full transition-all hover:scale-110"
                    style={{
                      backgroundColor: c,
                      boxShadow: bgColor === c ? `0 0 0 2px white, 0 0 0 3.5px ${c}` : "none",
                      border: bgColor !== c ? "1px solid rgba(0,0,0,0.06)" : "none",
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </header>

        {/* 탭 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">
          {tab === "home" ? (
            <HomeTab bgColor={bgColor} recentSites={recentSites} onStart={() => setTab("my")} />
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
        </div>

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
          <Tab active={tab === "my"} onClick={() => setTab("my")} activeColor={bgColor} label="나의 도전"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={tab === "my" ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
          />
        </TabBar>
      </AppShell>
    </Watermark>
  );
}
