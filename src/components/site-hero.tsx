"use client";

import { useAccent } from "@/lib/theme-context";
import { Section } from "@m1kapp/kit";
import { SitePreviewCard } from "./site-preview-card";
import { ShareButton } from "./share-button";
import { todayKST } from "@/lib/format";
import type { SiteData } from "./dashboard-view";
import { Avatar } from "./avatar";

function calcStreak(daily: { date: string; count: number }[], today: Date = new Date()): number {
  if (daily.length === 0) return 0;
  const dates = new Set(daily.filter((d) => d.count > 0).map((d) => d.date));
  const todayStr = todayKST(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = todayKST(yesterday);
  const start = dates.has(todayStr) ? todayStr : dates.has(yesterdayStr) ? yesterdayStr : null;
  if (!start) return 0;
  let streak = 0;
  const cursor = new Date(start);
  while (dates.has(todayKST(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function hoursToReach(daily: { date: string; count: number }[], target: number): number | null {
  let sum = 0;
  for (let i = 0; i < daily.length; i++) {
    sum += daily[i].count;
    if (sum >= target) return (i + 1) * 24;
  }
  return null;
}

function getContextLine(data: SiteData, streak: number): string {
  const { total, todayCount, daily, verified } = data;
  const remaining = 1_000 - total;
  const hours1K = hoursToReach(daily, 1_000);
  const activeDays = daily.filter((d) => d.count > 0).length;

  if (streak >= 30) return `🏆 ${streak}일 연속 — 진짜 대단해요`;
  if (streak >= 14) return `🔥 ${streak}일 연속 중 — 멈추면 안 돼요`;
  if (streak >= 7)  return `🔥 ${streak}일 연속 — 불타고 있어요`;
  if (total >= 1_000 && hours1K) {
    const label = hours1K > 100 ? `${Math.round(hours1K / 24)}일` : `${hours1K}시간`;
    return `🚀 ${label} 만에 1K 달성 · 10K 가즈아`;
  }
  if (remaining > 0 && remaining <= 50) return `⚡ ${remaining}명만 더하면 1K!`;
  if (remaining > 0 && remaining <= 200) return `💪 1K까지 ${remaining.toLocaleString()}명 남았어요`;
  if (todayCount > 0 && streak > 1) return `오늘도 ${todayCount.toLocaleString()}명 방문 중 · ${streak}일 연속`;
  if (todayCount > 0) return `오늘 ${todayCount.toLocaleString()}명이 찾아왔어요`;
  if (activeDays > 0) return `방문자 트래커 달고 ${activeDays}일째 기록 중`;
  if (!verified) return `뱃지를 심으면 방문자 추적이 시작돼요`;
  return `트래커 설치 완료 — 첫 방문자를 기다리는 중`;
}

export function StreakChip({ daily }: { daily: { date: string; count: number }[] }) {
  const streak = calcStreak(daily);
  const legendary = streak >= 30;
  const hot      = streak >= 7;
  const active   = streak > 0;

  const bgClass = legendary
    ? "bg-yellow-50 dark:bg-yellow-950/30"
    : hot
    ? "bg-orange-50 dark:bg-orange-950/30"
    : "bg-zinc-50 dark:bg-zinc-900";

  const labelColor = legendary ? "text-yellow-500" : hot ? "text-orange-400" : "text-zinc-400";
  const valueColor = legendary
    ? "text-yellow-500"
    : hot
    ? "text-orange-500"
    : active
    ? "text-zinc-900 dark:text-white"
    : "text-zinc-300 dark:text-zinc-600";

  const glow = legendary
    ? "0 0 16px #f59e0b33"
    : hot
    ? "0 0 12px #f9731633"
    : undefined;

  return (
    <div
      className={`flex-1 rounded-xl py-3 px-3 text-center transition-all ${bgClass}`}
      style={glow ? { boxShadow: glow } : undefined}
    >
      <p className={`text-[10px] mb-0.5 font-medium ${labelColor}`}>
        {legendary ? "🏆 연속" : hot ? "🔥 연속" : "연속"}
      </p>
      <p className={`text-lg font-black tabular-nums ${valueColor}`}>
        {active ? `${streak}일` : "–"}
      </p>
    </div>
  );
}


export function SiteHero({ data, owner }: {
  data: SiteData;
  owner?: { handle: string; name: string; imageUrl: string } | null;
}) {
  const { accent } = useAccent();
  const displayName = data.ogTitle || data.title || data.slug;
  const streak = calcStreak(data.daily);
  const contextLine = getContextLine(data, streak);

  return (
    <Section className="pt-4 pb-2">
      {/* 사이트 카드 */}
      <SitePreviewCard
        slug={data.slug}
        name={displayName}
        faviconUrl={data.faviconUrl}
        color={accent}
        description={data.ogDescription}
        thumbnailSize="lg"
        variant="bare"
        right={<ShareButton slug={data.slug} title={displayName} />}
      />

      {/* 오너 링크 */}
      {owner?.handle && (
        <a
          href={`/@${owner.handle}`}
          className="flex items-center justify-end gap-1.5 mt-1.5 group"
        >
          <span className="text-[11px] text-zinc-300 dark:text-zinc-600">built by</span>
          <Avatar imageUrl={owner.imageUrl} name={owner.name} size={20} ring={false} />
          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
            @{owner.handle}
          </span>
        </a>
      )}

      {/* 히어로 숫자 */}
      <div className="mt-3 mb-0">
        <div className="flex items-end gap-1.5">
          <span className="text-[36px] font-black tabular-nums leading-none tracking-tight text-zinc-900 dark:text-white">
            {data.total.toLocaleString()}
          </span>
          <span className="text-sm font-semibold text-zinc-300 dark:text-zinc-600 mb-1">명 방문</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          {data.todayCount > 0 && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-lg tabular-nums"
              style={{ color: accent, backgroundColor: `${accent}1a` }}
            >
              +{data.todayCount.toLocaleString()} 오늘
            </span>
          )}
          {streak > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-orange-500">
              🔥 {streak}일
            </span>
          )}
        </div>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 leading-relaxed">
          {contextLine}
        </p>
      </div>
    </Section>
  );
}
