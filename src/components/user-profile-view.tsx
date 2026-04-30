"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell, AppShellContent, Section, Watermark } from "@m1kapp/kit";
import { SiteCard } from "./site-card";
import { Avatar } from "./avatar";
import { SitePreviewCard } from "./site-preview-card";
import { formatLogDate } from "@/lib/format";
import type { UserInfo } from "@/lib/user-handle";
import type { RecentSite } from "@/lib/types";

interface UserStats {
  apps: number;
  totalVisitors: number;
  todayVisitors: number;
  totalBoost: number;
}

export interface BoostLog {
  amount: number;
  createdAt: string | null;
  memo: string | null;
  userName: string;
  userImageUrl: string | null;
  siteSlug: string;
  siteName: string;
  siteDescription: string | null;
  siteFavicon: string | null;
  siteColor: string | null;
}

interface UserProfileViewProps {
  user: UserInfo;
  sites: RecentSite[];
  stats: UserStats;
  boostLogs: BoostLog[];
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 tracking-wider">{label}</span>
      <span className="text-base font-bold text-zinc-900 dark:text-white tabular-nums">
        {value.toLocaleString("ko-KR")}
      </span>
    </div>
  );
}

type ProfileTab = "apps" | "boosts";

export function UserProfileView({ user, sites, stats, boostLogs }: UserProfileViewProps) {
  const [tab, setTab] = useState<ProfileTab>("apps");

  return (
    <Watermark>
    <AppShell>
      <header className="sticky top-0 z-20 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md h-14 shrink-0">
        <div className="flex items-center gap-2 px-4 h-full">
          <Link
            href="/"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 dark:text-zinc-400">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <Link href="/" className="text-xl font-black tracking-tighter text-zinc-900 dark:text-white">
            m1k
          </Link>
        </div>
      </header>

      <AppShellContent>
        <Section className="pt-6 pb-4">
          <div className="flex items-center gap-4">
            <Avatar imageUrl={user.imageUrl} name={user.name || user.handle} size={56} ring={false} />
            <div className="min-w-0">
              <p className="text-base font-bold text-zinc-900 dark:text-white truncate">
                {user.name}
              </p>
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                @{user.handle}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 mt-5 py-3">
            <StatItem label="APP" value={stats.apps} />
            <StatItem label="TODAY" value={stats.todayVisitors} />
            <StatItem label="TOTAL" value={stats.totalVisitors} />
          </div>
        </Section>

        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          {(["apps", "boosts"] as ProfileTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-semibold text-center transition-colors relative ${
                tab === t
                  ? "text-zinc-900 dark:text-white"
                  : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {t === "apps" ? (
                <>앱 <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">{stats.apps}</span></>
              ) : (
                <>응원 <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">{stats.totalBoost.toLocaleString("ko-KR")}</span></>
              )}
              {tab === t && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-white" />
              )}
            </button>
          ))}
        </div>

        {tab === "apps" ? (
          <Section className="py-3">
            {sites.length === 0 ? (
              <p className="text-sm text-zinc-400 py-8 text-center">등록된 사이트가 없어요</p>
            ) : (
              <div>
                {sites.map((site) => (
                  <SiteCard key={site.slug} site={site} />
                ))}
              </div>
            )}
          </Section>
        ) : (
          <Section className="py-3">
            {boostLogs.length === 0 ? (
              <p className="text-sm text-zinc-400 py-8 text-center">아직 응원이 없어요</p>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {boostLogs.map((log, i) => (
                  <div key={i} className="py-3">
                    {/* 유저 */}
                    <div className="flex items-start gap-2.5">
                      <div className="shrink-0 pt-0.5">
                        <Avatar imageUrl={log.userImageUrl} name={log.userName || "?"} size={32} ring={false} />
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">{log.userName}</span>
                          <span className="text-[10px] text-zinc-400 shrink-0">{log.createdAt ? formatLogDate(log.createdAt) : ""}</span>
                          <span className="text-[11px] font-bold text-zinc-400 tabular-nums shrink-0 ml-auto">🚀 +{log.amount.toLocaleString()}</span>
                        </div>
                        {/* 앱 인용 */}
                        <Link href={`/${log.siteSlug}`} className="block mt-1.5 px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors overflow-hidden">
                          <SitePreviewCard
                            slug={log.siteSlug}
                            name={log.siteName}
                            faviconUrl={log.siteFavicon}
                            color={log.siteColor}
                            description={log.siteDescription}
                            variant="bare"
                            thumbnailSize="sm"
                          />
                        </Link>
                      </div>
                    </div>
                    {/* 메모 */}
                    {log.memo && (
                      <p className="text-[13px] text-zinc-700 dark:text-zinc-300 leading-snug mt-2 ml-[42px]">{log.memo}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}
      </AppShellContent>
    </AppShell>
    </Watermark>
  );
}
