"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteCard, SiteCardSkeleton } from "@/components/site-card";
import { Divider, EmptyState, InAppSheet } from "@m1kapp/kit";
import { BoostShop } from "@/components/boost-shop";
import { BoostHistorySheet } from "@/components/boost-history-sheet";
import type { RecentSite } from "@/lib/types";
import { RegisterForm, BoostedSiteCard, ProfileHeader, type BoostedSite } from "./my-tab-parts";


export function MyTab({
  sites,
  isSignedIn,
  bgColor,
  onRegistered,
  sitesLoading = false,
}: {
  sites: RecentSite[];
  isSignedIn: boolean;
  bgColor: string;
  onRegistered: () => void;
  sitesLoading?: boolean;
}) {
  const [pointBalance, setPointBalance] = useState<number | null>(null);
  const [showBoostShop, setShowBoostShop] = useState(false);
  const [showRegisterSheet, setShowRegisterSheet] = useState(false);
  const [boostedSites, setBoostedSites] = useState<BoostedSite[]>([]);
  const [activeSection, setActiveSection] = useState<"mine" | "others">("mine");

  const fetchBalance = () => {
    fetch("/api/points")
      .then((r) => r.json())
      .then((d) => setPointBalance(d.balance ?? null))
      .catch(() => {});
  };

  const fetchBoostedSites = () => {
    fetch("/api/points/boosted-sites")
      .then((r) => r.json())
      .then((d) => setBoostedSites(d.sites ?? []))
      .catch(() => {});
  };

  useEffect(() => {
    if (!isSignedIn) return;
    fetchBalance();
    fetchBoostedSites();
  }, [isSignedIn]);

  useEffect(() => {
    const handler = () => { fetchBalance(); fetchBoostedSites(); };
    window.addEventListener("m1k:boost-completed", handler);
    return () => window.removeEventListener("m1k:boost-completed", handler);
  }, []);

  const refreshBalance = fetchBalance;

  const totalHits = sites.reduce((sum, s) => sum + Number(s.total), 0);

  const router = useRouter();

  useEffect(() => {
    if (!isSignedIn) router.replace("/sign-in?redirect=/my");
  }, [isSignedIn, router]);

  if (!isSignedIn) return null;

  return (
    <div className="relative min-h-full px-4 pt-2 pb-24">
      <ProfileHeader
        sitesCount={sites.length}
        totalHits={totalHits}
        pointBalance={pointBalance}
        onOpenShop={() => setShowBoostShop(true)}
      />

      {/* 섹션 탭 */}
      <div className="flex gap-1 mb-5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
        <button
          onClick={() => setActiveSection("mine")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeSection === "mine"
              ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          나의 도전
        </button>
        <button
          onClick={() => setActiveSection("others")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeSection === "others"
              ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          내가 응원한 도전
          {boostedSites.length > 0 && (
            <span className="ml-1 text-[9px] opacity-60">{boostedSites.length}</span>
          )}
        </button>
      </div>

      {activeSection === "mine" ? (
        <>
          <Divider />
          {sitesLoading ? (
            <SiteCardSkeleton count={3} />
          ) : sites.length > 0 ? (
            <div className="space-y-0">
              {sites.map((site) => (
                <SiteCard key={site.slug} site={site} />
              ))}
            </div>
          ) : (
            <EmptyState message="사이트를 등록하고 1K 도전을 시작해보세요" />
          )}
        </>
      ) : (
        <>
          {boostedSites.length > 0 ? (
            <div className="space-y-2">
              {boostedSites.map((site) => (
                <BoostedSiteCard key={site.slug} site={site} />
              ))}
            </div>
          ) : (
            <EmptyState message="부스트를 보낸 사이트가 여기에 표시돼요" />
          )}
        </>
      )}

      {activeSection === "mine" && (
        <div className="absolute right-4 bottom-4 z-40">
          <button
            onClick={() => setShowRegisterSheet(true)}
            className="flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-lg shadow-black/20 active:scale-[0.98] transition-transform"
            style={{ backgroundColor: bgColor }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            사이트 등록
          </button>
        </div>
      )}

      <InAppSheet
        open={showRegisterSheet}
        onClose={() => setShowRegisterSheet(false)}
        className="rounded-t-2xl bg-white dark:bg-zinc-950 p-5 pb-8 shadow-2xl"
      >
        <div className="mb-4">
          <p className="text-sm font-bold text-zinc-900 dark:text-white">사이트 등록</p>
          <p className="text-[11px] text-zinc-400 mt-1">프로필에 연결할 사이트 주소를 입력하세요.</p>
        </div>
        <RegisterForm
          bgColor={bgColor}
          onRegistered={onRegistered}
          onClose={() => setShowRegisterSheet(false)}
        />
        <button
          onClick={() => {
            setShowRegisterSheet(false);
            router.push("/connect");
          }}
          className="mt-3 w-full text-center text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          ✨ AI(클로드)로 한 번에 연결하기 →
        </button>
      </InAppSheet>

      <InAppSheet
        open={showBoostShop}
        onClose={() => setShowBoostShop(false)}
        className="rounded-t-2xl bg-white dark:bg-zinc-950 p-5 pb-8 shadow-2xl"
      >
        <div className="mb-4">
          <span className="text-sm font-bold text-zinc-900 dark:text-white">부스트 충전</span>
        </div>
        <BoostShop onPurchased={() => { refreshBalance(); setShowBoostShop(false); }} />
      </InAppSheet>
    </div>
  );
}
