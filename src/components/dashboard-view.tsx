"use client";

import { useState } from "react";
import { GrassMap } from "./grass-map";
import { BadgeConfigurator } from "./badge-configurator";
import { Watermark } from "./watermark";
import { AccentProvider, useAccent } from "@/lib/theme-context";
import {
  Section,
  Divider,
  StatChip,
  AnalyticsSection,
  AppShell,
} from "./ui-parts";
import { countryFlag, deviceIcon, extractDomain } from "@/lib/format";

interface SiteData {
  slug: string;
  title: string | null;
  url: string | null;
  total: number;
  weekly: number;
  monthly: number;
  daily: { date: string; count: number }[];
  countries: { country: string | null; count: number }[];
  devices: { device: string | null; count: number }[];
  referers: { referer: string | null; count: number }[];
  createdAt: string | null;
  color: string | null;
  badgeStyle: string | null;
  badgeLabel: string | null;
  userId: string | null;
}

interface DashboardViewProps {
  data: SiteData;
  host: string;
  isOwner?: boolean;
}

export function DashboardView({ data, host, isOwner = false }: DashboardViewProps) {
  return (
    <AccentProvider>
      <Watermark>
        <AppShell>
          {/* 헤더 — 뒤로가기 + 사이트 바로가기 */}
          <DashboardHeader url={data.url} title={data.title} slug={data.slug} />

          {/* 원페이저 스크롤 */}
          <div className="flex-1 overflow-y-auto">
            {/* 사이트 히어로 */}
            <SiteHero data={data} />

            {/* 통계 칩 */}
            <Section className="flex gap-3 pt-5">
              <StatChip label="이번 주" value={data.weekly} />
              <StatChip label="이번 달" value={data.monthly} />
              <StatChip label="전체" value={data.total} />
            </Section>

            <Divider />

            {/* 잔디 */}
            <Section>
              <GrassMap daily={data.daily} createdAt={data.createdAt} />
            </Section>

            <Divider />

            {/* 분석 */}
            <Section className="space-y-5">
              <AnalyticsSection
                title="국가"
                items={data.countries.map((c) => ({
                  label: `${countryFlag(c.country)} ${c.country || "알 수 없음"}`,
                  value: Number(c.count),
                }))}
              />
              <AnalyticsSection
                title="디바이스"
                items={data.devices.map((d) => ({
                  label: `${deviceIcon(d.device)} ${d.device}`,
                  value: Number(d.count),
                }))}
              />
              <AnalyticsSection
                title="유입 경로"
                items={data.referers.map((r) => ({
                  label: extractDomain(r.referer),
                  value: Number(r.count),
                }))}
              />
            </Section>

            <Divider />

            {/* 배지 설정 */}
            <Section className="pb-12">
              <BadgeConfigurator
                slug={data.slug}
                host={host}
                initialColor={data.color || undefined}
                initialStyle={data.badgeStyle || undefined}
                initialLabel={data.badgeLabel || undefined}
                isOwner={isOwner}
              />
            </Section>
          </div>
        </AppShell>
      </Watermark>
    </AccentProvider>
  );
}

function DashboardHeader({
  url,
  title,
  slug,
}: {
  url: string | null;
  title: string | null;
  slug: string;
}) {
  const { accent } = useAccent();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 py-3">
        {/* 뒤로 + 로고 */}
        <div className="flex items-center gap-2">
          <a
            href="/"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 dark:text-zinc-400">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </a>
          <a href="/" className="text-xl font-black tracking-tighter" style={{ color: accent }}>
            m1k
          </a>
        </div>

        {/* 사이트 바로가기 */}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <span className="truncate max-w-32">{url.replace(/^https?:\/\//, "")}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </div>
    </header>
  );
}

function SiteHero({ data }: { data: SiteData }) {
  const { accent } = useAccent();
  const progress = Math.min(data.total / 1000, 1);
  const percentage = (progress * 100).toFixed(1);
  const displayName = data.title || data.slug;

  return (
    <Section className="pt-6 pb-2">
      {/* 사이트 정보 */}
      <div className="flex items-center gap-3 mb-5">
        {/* OG 이미지 or 컬러 아이콘 */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
          style={{ backgroundColor: data.color || accent }}
        >
          <span className="text-sm font-black text-white/80">
            {displayName.slice(0, 2)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-white truncate">
            {displayName}
          </h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
            {data.slug}
          </p>
        </div>
      </div>

      {/* 숫자 + 게이지바 */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black tabular-nums text-zinc-900 dark:text-white">
              {data.total.toLocaleString()}
            </span>
            <span className="text-sm text-zinc-300 dark:text-zinc-600 font-medium">/ 1K</span>
          </div>
          <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500 font-medium">
            {percentage}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.max(Number(percentage), 0.5)}%`,
              backgroundColor: accent,
            }}
          />
        </div>
        {/* 마일스톤 */}
        <div className="flex justify-between px-0.5">
          {[250, 500, 750, 1000].map((m) => (
            <span
              key={m}
              className="text-[9px] tabular-nums font-medium"
              style={{ color: data.total >= m ? accent : undefined }}
            >
              <span className={data.total < m ? "text-zinc-300 dark:text-zinc-700" : ""}>
                {m >= 1000 ? "1K" : m}
              </span>
            </span>
          ))}
        </div>
      </div>
    </Section>
  );
}
