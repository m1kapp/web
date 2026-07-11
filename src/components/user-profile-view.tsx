"use client";

import Link from "next/link";
import { AppShell, AppShellContent, Section, Watermark } from "@m1kapp/kit";
import { SiteCard } from "./site-card";
import { Avatar } from "./avatar";
import type { UserInfo } from "@/lib/user-handle";
import type { RecentSite } from "@/lib/types";

interface UserStats {
  apps: number;
  totalVisitors: number;
  todayVisitors: number;
}

interface UserProfileViewProps {
  user: UserInfo;
  sites: RecentSite[];
  stats: UserStats;
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

export function UserProfileView({ user, sites, stats }: UserProfileViewProps) {
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
      </AppShellContent>
    </AppShell>
    </Watermark>
  );
}
