"use client";

import { useState, useEffect } from "react";
import { SiteCard } from "@/components/site-card";
import { SectionHeader } from "@m1kapp/kit";
import type { RecentSite } from "@/lib/types";
import { TypewriterHero, FAQSection } from "./home-tab-parts";



export function HomeTab({
  bgColor,
  recentSites,
  selfSlug,
  onStart,
}: {
  bgColor: string;
  recentSites: RecentSite[];
  selfSlug: string | null;
  onStart: () => void;
}) {

  return (
    <>
      {/* 싸이월드 방문자 카운터 — 최상단 얇은 바 */}
      {selfSlug && (
        <div className="w-full flex justify-center py-2">
          <a href={`/${selfSlug}`} target="_blank" rel="noopener noreferrer" className="block h-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/badge/${selfSlug}.svg`} alt="badge" className="dark:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/badge/${selfSlug}-dark.svg`} alt="badge" className="hidden dark:block" /> 
          </a>
        </div>
      )}

      {/* 히어로 */}
      <div className="px-4 pt-6 pb-8 text-center">
        <h1 className="text-5xl font-black tracking-tighter mb-1" style={{ color: bgColor }}>
          m1k
        </h1>
        <p className="text-xs text-zinc-400 mb-6">
          make 1k, m1k !
        </p>

        {/* 타이핑 + 슬로건 */}
        <div className="mb-6">
          <p className="text-lg text-zinc-400 dark:text-zinc-500 min-h-7 mb-4">
            <TypewriterHero bgColor={bgColor} />
          </p>
          <p className="text-xl font-black tracking-tight leading-snug text-zinc-900 dark:text-white">
            방문자 1,000명이 목표라면
          </p>
          <p className="text-xl font-black tracking-tight leading-snug" style={{ color: bgColor }}>
            방문자 트래커부터 달아보세요
          </p>
        </div>

        {/* 시작하기 */}
        <button
          onClick={onStart}
          className="w-full h-12 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] mb-3"
          style={{ backgroundColor: bgColor }}
        >
          시작하기
        </button>

        {/* 3스텝 — 한 줄로 간결하게 */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400">
          <span>📝 사이트 등록</span>
          <span className="text-zinc-200">→</span>
          <span>🏷️ 트래커 심기</span>
          <span className="text-zinc-200">→</span>
          <span>🚀 함께 성장</span>
        </div>
      </div>

      {/* 최근 등록 */}
      {recentSites.length > 0 && (
        <div className="px-4 pb-2">
          <SectionHeader>최근 등록</SectionHeader>
          <div className="space-y-0">
            {recentSites.slice(0, 3).map((site) => (
              <SiteCard key={site.slug} site={site} />
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="px-4 pt-6 pb-8">
        <SectionHeader>자주 묻는 질문</SectionHeader>
        <FAQSection />
      </div>
    </>
  );
}


