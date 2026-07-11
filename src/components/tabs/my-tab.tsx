"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteCard, SiteCardSkeleton } from "@/components/site-card";
import { Divider, EmptyState, InAppSheet } from "@m1kapp/kit";
import type { RecentSite } from "@/lib/types";
import { RegisterForm, ProfileHeader } from "./my-tab-parts";


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
  const [showRegisterSheet, setShowRegisterSheet] = useState(false);

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
      />

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
    </div>
  );
}
