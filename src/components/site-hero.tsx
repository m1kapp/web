"use client";

import { useAccent } from "@/lib/theme-context";
import { Section } from "@m1kapp/kit";
import { SitePreviewCard } from "./site-preview-card";
import { ShareButton } from "./share-button";
import { getUnlockedAchievements, getCurrentGoal, GOAL_TIERS, calcStreak } from "@/lib/achievements";
import type { SiteData } from "./dashboard-view";

const STREAK_FIRE_THRESHOLD = 7;

function formatGoalNumber(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}K`;
  return n.toString();
}

export function StreakChip({ daily }: { daily: { date: string; count: number }[] }) {
  const streak = calcStreak(daily);
  const fire = streak >= STREAK_FIRE_THRESHOLD;

  return (
    <div className={`flex-1 rounded-xl py-3 px-3 text-center ${fire ? "bg-orange-50 dark:bg-orange-950/30" : "bg-zinc-50 dark:bg-zinc-900"}`}>
      <p className={`text-[10px] mb-0.5 ${fire ? "text-orange-400" : "text-zinc-400"}`}>
        {fire ? "🔥 연속" : "연속"}
      </p>
      <p className={`text-lg font-black tabular-nums ${fire ? "text-orange-500" : streak > 0 ? "text-zinc-900 dark:text-white" : "text-zinc-300 dark:text-zinc-600"}`}>
        {streak > 0 ? `${streak}일` : "-"}
      </p>
    </div>
  );
}

export function SiteHero({ data, onMoreBadges }: { data: SiteData; onMoreBadges?: () => void }) {
  const { accent } = useAccent();
  const displayName = data.ogTitle || data.title || data.slug;
  const streak = calcStreak(data.daily);
  const counts = { total: data.total, weekly: data.weekly, daily: data.todayCount, streak };
  const unlocked = getUnlockedAchievements(counts);

  const currentGoal = getCurrentGoal(data.total);
  const prevGoalValue = GOAL_TIERS[GOAL_TIERS.indexOf(currentGoal) - 1]?.goal ?? 0;
  const rangeTotal = currentGoal.goal - prevGoalValue;
  const rangeCurrent = data.total - prevGoalValue;
  const progress = data.total >= currentGoal.goal ? 1 : Math.min(rangeCurrent / rangeTotal, 1);
  const percentage = (progress * 100).toFixed(1);

  const step = rangeTotal / 4;
  const milestones = [1, 2, 3, 4].map((i) => prevGoalValue + step * i);

  const achievedGoals = GOAL_TIERS.filter((t) => data.total >= t.goal);
  const latestAchieved = achievedGoals[achievedGoals.length - 1];

  return (
    <Section className="pt-6 pb-2">
      <div className="mb-5">
        <SitePreviewCard
          slug={data.slug}
          name={displayName}
          url={data.url}
          ogImage={data.ogImage}
          color={accent}
          description={data.ogDescription}
          thumbnailSize="lg"
          variant="bare"
          right={<ShareButton slug={data.slug} title={displayName} />}
        />
      </div>

      {unlocked.length > 0 && (
        <div className="flex items-center gap-1 mb-4">
          <div className="flex flex-wrap gap-1 flex-1">
            {unlocked.map((a) => (
              <span key={a.name} className="text-base group relative cursor-default" title={a.name}>
                {a.icon}
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                  <div className="bg-zinc-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
                    {a.name} — {a.condition}
                  </div>
                </div>
              </span>
            ))}
          </div>
          {onMoreBadges && (
            <button
              onClick={onMoreBadges}
              className="shrink-0 text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors px-1.5 py-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              더보기 →
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black tabular-nums text-zinc-900 dark:text-white">
              {data.total.toLocaleString()}
            </span>
            <span className="text-sm text-zinc-300 dark:text-zinc-600 font-medium">
              / {currentGoal.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {latestAchieved && (
              <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ backgroundColor: accent }}>
                {latestAchieved.emoji} {latestAchieved.label} 달성!
              </span>
            )}
            <span className="text-xs tabular-nums text-zinc-400 font-medium">
              {percentage}%
            </span>
          </div>
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.max(Number(percentage), 0.5)}%`, backgroundColor: accent }}
          />
        </div>
        <div className="flex justify-between px-0.5">
          {milestones.map((m) => (
            <span
              key={m}
              className={`text-[9px] tabular-nums font-medium ${data.total < m ? "text-zinc-300 dark:text-zinc-700" : ""}`}
              style={{ color: data.total >= m ? accent : undefined }}
            >
              {formatGoalNumber(m)}
            </span>
          ))}
        </div>
        {data.boosted > 0 && (
          <div className="flex items-center gap-1 mt-2 text-[10px] text-zinc-400">
            <span className="font-semibold text-zinc-600 dark:text-zinc-300">{(data.total - data.boosted).toLocaleString()}</span>
            <span>+</span>
            <span className="font-semibold text-zinc-600 dark:text-zinc-300">🚀 {data.boosted.toLocaleString()}</span>
            <span>= {data.total.toLocaleString()}</span>
          </div>
        )}
      </div>
    </Section>
  );
}