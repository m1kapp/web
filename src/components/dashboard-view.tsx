"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { ShareButton } from "./share-button";
import { getUnlockedAchievements, getLockedAchievements, getCurrentGoal, GOAL_TIERS, calcStreak } from "@/lib/achievements";
import { useConfetti } from "./confetti";

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
  badgeEmoji: string | null;
  userId: string | null;
  todayCount: number;
  verified: boolean;
  parentId: number | null;
  boosted: number;
}

interface DashboardViewProps {
  data: SiteData;
  host: string;
  isOwner?: boolean;
}

export function DashboardView({ data: initialData, host, isOwner = false }: DashboardViewProps) {
  const fire = useConfetti();
  const [data, setData] = useState(initialData);

  // 목표 달성 시 confetti (1K, 10K, 100K, 1M)
  useEffect(() => {
    const achieved = GOAL_TIERS.some((t) => data.total >= t.goal);
    if (achieved) {
      const timer = setTimeout(fire, 500);
      return () => clearTimeout(timer);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 30초마다 통계 폴링
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/sites/${data.slug}`);
        if (!res.ok) return;
        const fresh = await res.json();
        setData((prev) => ({
          ...prev,
          total: fresh.total,
          weekly: fresh.weekly ?? prev.weekly,
          monthly: fresh.monthly ?? prev.monthly,
          todayCount: fresh.todayCount ?? prev.todayCount,
          daily: fresh.daily ?? prev.daily,
        }));
      } catch {}
    }, 30_000);
    return () => clearInterval(interval);
  }, [data.slug]);

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

            {/* 미인증 안내 */}
            {!data.verified && (
              <PendingBanner slug={data.slug} host={host} />
            )}

            {/* 통계 칩 */}
            <Section className="flex gap-3 pt-5">
              <StreakChip daily={data.daily} />
              <StatChip label="이번 주" value={data.weekly} />
              <StatChip label="이번 달" value={data.monthly} />
              <StatChip label="전체" value={data.total} />
            </Section>

            {/* 부스트 */}
            <Section className="pt-3">
              <BoostButton slug={data.slug} />
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

            {/* 하위 뱃지 */}
            {!data.parentId && (
              <Section className="pb-1">
                <SubBadges slug={data.slug} host={host} isOwner={isOwner} />
              </Section>
            )}

            {!data.parentId && <Divider />}

            {/* 배지 설정 */}
            <Section className="pb-4">
              <BadgeConfigurator
                slug={data.slug}
                host={host}
                initialColor={data.color || undefined}
                initialStyle={data.badgeStyle || undefined}
                initialLabel={data.badgeLabel || undefined}
                counts={{ total: data.total, weekly: data.weekly, daily: data.todayCount }}
                isOwner={isOwner}
              />
            </Section>

            {/* 사이트 삭제 */}
            {isOwner && (
              <Section className="pb-12">
                <DeleteSiteButton slug={data.slug} />
              </Section>
            )}
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

interface SubBadge {
  slug: string;
  path: string | null;
  title: string | null;
  verified: boolean;
  total: number;
}

function SubBadges({ slug, host, isOwner }: { slug: string; host: string; isOwner: boolean }) {
  const { accent } = useAccent();
  const [subs, setSubs] = useState<SubBadge[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [path, setPath] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/sites/sub?parentSlug=${slug}`)
      .then((res) => res.json())
      .then((data) => Array.isArray(data) ? setSubs(data) : setSubs([]))
      .catch(() => {});
  }, [slug]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!path.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/sites/sub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentSlug: slug, path: path.trim(), title: title.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubs((prev) => [...prev, data]);
        setPath("");
        setTitle("");
        setShowForm(false);
      } else {
        setError(data.error || "추가에 실패했어요");
      }
    } finally {
      setLoading(false);
    }
  }

  function copySnippet(subSlug: string) {
    const badgeUrl = `https://${host}/badge/${subSlug}.svg`;
    const dashboardUrl = `https://${host}/${subSlug}`;
    navigator.clipboard.writeText(`[![Hits](${badgeUrl})](${dashboardUrl})`);
    setCopied(subSlug);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          하위 뱃지 <span className="text-zinc-300 dark:text-zinc-600 font-normal">{subs.length}</span>
        </h3>
        {isOwner && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg text-white transition-colors"
            style={{ backgroundColor: accent }}
          >
            {showForm ? "취소" : "+ 추가"}
          </button>
        )}
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <form onSubmit={handleAdd} className="mb-3 space-y-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2">
            <span className="text-zinc-300 text-sm shrink-0">/</span>
            <input
              type="text"
              placeholder="post/123"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none"
              required
            />
          </div>
          <input
            type="text"
            placeholder="라벨 (선택)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50"
            style={{ backgroundColor: accent }}
          >
            {loading ? "추가 중..." : "하위 뱃지 추가"}
          </button>
        </form>
      )}

      {/* 목록 */}
      {subs.length > 0 ? (
        <div className="space-y-1.5">
          {subs.map((sub) => (
            <div
              key={sub.slug}
              className="flex items-center gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3"
            >
              <div className="flex-1 min-w-0">
                <a href={`/${sub.slug}`} className="hover:underline">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                    /{sub.path}
                  </p>
                </a>
                {sub.title && sub.title !== `/${sub.path}` && (
                  <p className="text-[10px] text-zinc-400 truncate">{sub.title}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs tabular-nums font-semibold text-zinc-500">
                  {Number(sub.total).toLocaleString()}
                </span>
                {!sub.verified && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="미인증" />
                )}
                <button
                  onClick={() => copySnippet(sub.slug)}
                  className="text-[10px] font-semibold px-2 py-1 rounded-md transition-colors text-white"
                  style={{ backgroundColor: copied === sub.slug ? "#22c55e" : accent }}
                >
                  {copied === sub.slug ? "복사됨" : "코드"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !showForm ? (
        <p className="text-xs text-zinc-400 text-center py-3">
          {isOwner ? "페이지별 방문 추적을 시작해보세요" : "아직 하위 뱃지가 없어요"}
        </p>
      ) : null}
    </div>
  );
}

function DeleteSiteButton({ slug }: { slug: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/sites/settings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) {
        router.push("/");
      }
    } finally {
      setDeleting(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full text-xs text-zinc-400 hover:text-red-500 transition-colors py-2"
      >
        사이트 삭제
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-4 space-y-3">
      <p className="text-sm font-semibold text-red-600 dark:text-red-400">정말 삭제하시겠어요?</p>
      <p className="text-xs text-red-500/70">모든 방문 기록과 뱃지 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없어요.</p>
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 py-2 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {deleting ? "삭제 중..." : "삭제"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="flex-1 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  );
}

function PendingBanner({ slug, host }: { slug: string; host: string }) {
  const { accent } = useAccent();
  const [copied, setCopied] = useState(false);
  const badgeUrl = `https://${host}/badge/${slug}.svg`;
  const dashboardUrl = `https://${host}/${slug}`;
  const snippet = `[![Hits](${badgeUrl})](${dashboardUrl})`;

  return (
    <Section>
      <div className="rounded-xl border-2 border-dashed p-4 space-y-3" style={{ borderColor: accent }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse" style={{ backgroundColor: accent }}>
            !
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
            뱃지를 사이트에 심어주세요
          </h3>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">
          아래 코드를 내 사이트에 붙여넣으면 인증이 완료되고,
          탐색 목록에 노출돼요.
        </p>
        <div className="relative">
          <pre className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-3 text-[11px] text-zinc-700 dark:text-zinc-300 overflow-x-auto">
            {snippet}
          </pre>
          <button
            onClick={() => {
              navigator.clipboard.writeText(snippet);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="absolute top-2 right-2 px-2 py-1 rounded-md text-[10px] font-semibold text-white transition-colors"
            style={{ backgroundColor: copied ? "#22c55e" : accent }}
          >
            {copied ? "복사됨!" : "복사"}
          </button>
        </div>
        <p className="text-[10px] text-zinc-400">
          방문자가 뱃지를 로드하면 자동으로 인증 완료됩니다
        </p>
      </div>
    </Section>
  );
}

function BoostButton({ slug }: { slug: string }) {
  const { accent } = useAccent();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("10");
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // 잔액 조회
  useEffect(() => {
    if (open && balance === null) {
      fetch("/api/points")
        .then((r) => r.json())
        .then((d) => setBalance(d.balance ?? null))
        .catch(() => {});
    }
  }, [open, balance]);

  async function handleInject() {
    const num = parseInt(amount);
    if (!num || num < 1) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/points/inject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, amount: num }),
      });
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance);
        setResult(`🚀 +${data.injected.toLocaleString()} 부스트 완료!`);
        setAmount("10");
        setTimeout(() => setResult(null), 3000);
      } else {
        setResult(data.error || "실패");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98]"
        style={{ backgroundColor: accent }}
      >
        🚀 부스트 보내기
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-zinc-900 dark:text-white">🚀 부스트</h4>
        <div className="flex items-center gap-2">
          {balance !== null && (
            <span className="text-xs text-zinc-400">
              🚀 <span className="font-bold text-zinc-700 dark:text-zinc-300">{balance.toLocaleString()}</span>
            </span>
          )}
          <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-600 text-lg leading-none">&times;</button>
        </div>
      </div>

      {/* 부스트 설명 */}
      <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3 space-y-2">
        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">🚀 부스트가 뭐예요?</p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
          부스트를 보내면 뱃지에 표시되는 숫자가 올라가요.
          실제 방문자와 합산되어 카운터에 표시됩니다.
        </p>
        <div className="flex gap-3 text-[10px] text-zinc-400">
          <span>🙋 내 사이트를 더 있어보이게</span>
        </div>
        <div className="flex gap-3 text-[10px] text-zinc-400">
          <span>🎁 친구 사이트에 응원 선물</span>
        </div>
        <div className="flex gap-3 text-[10px] text-zinc-400">
          <span>🏃 1K 달성을 앞당기기</span>
        </div>
      </div>
      <div className="flex gap-2">
        {[10, 50, 100].map((v) => (
          <button
            key={v}
            onClick={() => setAmount(String(v))}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
              amount === String(v) ? "text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
            }`}
            style={amount === String(v) ? { backgroundColor: accent } : undefined}
          >
            +{v}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none tabular-nums"
          placeholder="직접 입력"
        />
        <button
          onClick={handleInject}
          disabled={loading || !amount || parseInt(amount) < 1}
          className="px-5 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50 transition-all active:scale-[0.98]"
          style={{ backgroundColor: accent }}
        >
          {loading ? "..." : "투입"}
        </button>
      </div>
      {result && (
        <p className={`text-xs font-semibold text-center ${result.includes("완료") ? "text-green-500" : "text-red-500"}`}>
          {result}
        </p>
      )}
      {balance !== null && balance <= 0 && (
        <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3 text-center">
          <p className="text-xs text-zinc-500 mb-2">부스트가 부족해요</p>
          <a
            href="/"
            className="text-[11px] font-bold px-4 py-1.5 rounded-lg text-white inline-block"
            style={{ backgroundColor: accent }}
          >
            부스트 충전하기
          </a>
        </div>
      )}
    </div>
  );
}

function StreakChip({ daily }: { daily: { date: string; count: number }[] }) {
  const streak = calcStreak(daily);
  const fire = streak >= 7;
  const label = streak > 0 ? `${streak}일 연속` : "스트릭";

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

function formatGoalNumber(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}K`;
  return n.toString();
}

function SiteHero({ data }: { data: SiteData }) {
  const { accent } = useAccent();
  const displayName = data.title || data.slug;
  const streak = calcStreak(data.daily);
  const counts = { total: data.total, weekly: data.weekly, daily: data.todayCount, streak };
  const unlocked = getUnlockedAchievements(counts);
  const locked = getLockedAchievements(counts);

  // 동적 목표
  const currentGoal = getCurrentGoal(data.total);
  const prevGoalValue = GOAL_TIERS[GOAL_TIERS.indexOf(currentGoal) - 1]?.goal ?? 0;
  const rangeTotal = currentGoal.goal - prevGoalValue;
  const rangeCurrent = data.total - prevGoalValue;
  const progress = data.total >= currentGoal.goal ? 1 : Math.min(rangeCurrent / rangeTotal, 1);
  const percentage = (progress * 100).toFixed(1);

  // 현재 구간 마일스톤 (4등분)
  const step = rangeTotal / 4;
  const milestones = [1, 2, 3, 4].map((i) => prevGoalValue + step * i);

  // 달성한 목표들
  const achievedGoals = GOAL_TIERS.filter((t) => data.total >= t.goal);
  const latestAchieved = achievedGoals[achievedGoals.length - 1];

  return (
    <Section className="pt-6 pb-2">
      {/* 사이트 정보 */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
          style={{ backgroundColor: data.color || accent }}
        >
          <span className="text-sm font-black text-white/80">
            {displayName.slice(0, 2)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-zinc-900 truncate">
            {displayName}
          </h1>
          <p className="text-xs text-zinc-400 truncate">
            {data.url?.replace(/^https?:\/\//, "") || data.slug}
          </p>
        </div>
        {/* 공유 */}
        <ShareButton slug={data.slug} title={displayName} />
      </div>

      {/* 달성 뱃지 */}
      <div className="flex flex-wrap gap-1 mb-4">
        {unlocked.map((a) => (
          <span
            key={a.name}
            className="text-base group relative cursor-default"
            title={a.name}
          >
            {a.icon}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
              <div className="bg-zinc-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
                {a.name} — {a.condition}
              </div>
            </div>
          </span>
        ))}
        {locked.map((a) => (
          <span
            key={a.name}
            className="text-base opacity-15 grayscale group relative cursor-default"
            title={a.condition}
          >
            {a.icon}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
              <div className="bg-zinc-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
                {a.name} — {a.condition}
              </div>
            </div>
          </span>
        ))}
      </div>

      {/* 숫자 + 게이지바 */}
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
            style={{
              width: `${Math.max(Number(percentage), 0.5)}%`,
              backgroundColor: accent,
            }}
          />
        </div>
        {/* 마일스톤 */}
        <div className="flex justify-between px-0.5">
          {milestones.map((m) => (
            <span
              key={m}
              className="text-[9px] tabular-nums font-medium"
              style={{ color: data.total >= m ? accent : undefined }}
            >
              <span className={data.total < m ? "text-zinc-300 dark:text-zinc-700" : ""}>
                {formatGoalNumber(m)}
              </span>
            </span>
          ))}
        </div>
        {/* 실제 방문 vs 부스트 */}
        {data.boosted > 0 && (
          <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-400">
            <span>실제 방문 <span className="font-semibold text-zinc-600 dark:text-zinc-300">{(data.total - data.boosted).toLocaleString()}</span></span>
            <span>🚀 부스트 <span className="font-semibold text-zinc-600 dark:text-zinc-300">{data.boosted.toLocaleString()}</span></span>
          </div>
        )}
      </div>
    </Section>
  );
}
