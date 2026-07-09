"use client";

import { useMemo } from "react";
import type { SiteData } from "../dashboard-view";

// ─── 1K 코치 ─────────────────────────────────────────────────────────────────

interface Tip { icon: string; observation: string; action: string; priority: number }

const KR_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function formatHourKR(h: number): string {
  if (h === 0) return "자정";
  if (h === 12) return "정오";
  return h < 12 ? `오전 ${h}시` : `오후 ${h - 12}시`;
}

// 각 규칙은 독립적으로 데이터를 보고 Tip 또는 null 반환
const TIP_RULES: ((data: SiteData) => Tip | null)[] = [
  function wowGrowth({ daily }) {
    if (daily.length < 14) return null;
    const recent7 = daily.slice(-7).reduce((s, d) => s + d.count, 0);
    const prev7 = daily.slice(-14, -7).reduce((s, d) => s + d.count, 0);
    if (prev7 <= 0) return null;
    const pct = Math.round(((recent7 - prev7) / prev7) * 100);
    if (pct >= 20) return { icon: "📈", observation: `지난주보다 ${pct}% 올랐어요`, action: "이 추세 유지하세요! 지금 하는 게 통하고 있어요", priority: 90 };
    if (pct <= -20) return { icon: "📉", observation: `지난주보다 ${Math.abs(pct)}% 줄었어요`, action: "새로운 채널을 시도해보세요", priority: 85 };
    return null;
  },
  function refererHealth({ referers }) {
    if (referers.length === 0) {
      return { icon: "🔍", observation: "유입 경로가 아직 없어요", action: "SEO나 SNS 공유를 시작해보세요", priority: 80 };
    }
    const totalRef = referers.reduce((s, r) => s + Number(r.count), 0);
    const direct = referers.filter((r) => !r.referer).reduce((s, r) => s + Number(r.count), 0);
    if (totalRef <= 0 || direct / totalRef < 0.7) return null;
    const pct = Math.round((direct / totalRef) * 100);
    return { icon: "🔗", observation: `직접 접속이 ${pct}%에요`, action: "SNS나 커뮤니티에 링크를 공유해보세요", priority: 75 };
  },
  function mobileShare({ devices }) {
    const totalDev = devices.reduce((s, d) => s + Number(d.count), 0);
    if (totalDev <= 0) return null;
    const mobile = devices.filter((d) => d.device === "mobile").reduce((s, d) => s + Number(d.count), 0);
    if (mobile / totalDev < 0.65) return null;
    const pct = Math.round((mobile / totalDev) * 100);
    return { icon: "📱", observation: `모바일 사용자가 ${pct}%에요`, action: "모바일 로딩 속도를 체크해보세요", priority: 70 };
  },
  function earlyEncouragement({ total, createdAt }) {
    if (total >= 100 || !createdAt) return null;
    const daysSince = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000);
    if (daysSince < 7) return null;
    return { icon: "🌱", observation: "아직 초반이에요", action: "꾸준히 공유하면 반드시 늘어요", priority: 65 };
  },
  function foreignShare({ countries }) {
    const totalGeo = countries.reduce((s, c) => s + Number(c.count), 0);
    if (totalGeo <= 0) return null;
    const kr = countries.filter((c) => c.country === "KR").reduce((s, c) => s + Number(c.count), 0);
    const foreign = (totalGeo - kr) / totalGeo;
    if (foreign < 0.3) return null;
    return { icon: "🌏", observation: `해외 방문자가 ${Math.round(foreign * 100)}%에요`, action: "영어 콘텐츠를 고려해보세요", priority: 60 };
  },
  function weekendWeakness({ daily }) {
    if (daily.length < 14) return null;
    const weekday: number[] = [], weekend: number[] = [];
    daily.forEach((d) => {
      const day = new Date(d.date + "T00:00:00+09:00").getDay();
      (day === 0 || day === 6 ? weekend : weekday).push(d.count);
    });
    const wdAvg = weekday.length ? weekday.reduce((a, b) => a + b, 0) / weekday.length : 0;
    const weAvg = weekend.length ? weekend.reduce((a, b) => a + b, 0) / weekend.length : 0;
    if (wdAvg <= 0 || weAvg >= wdAvg * 0.5) return null;
    return { icon: "📅", observation: "주말 트래픽이 약해요", action: "주말용 콘텐츠를 준비해보세요", priority: 55 };
  },
  function peakHour({ hourly }) {
    if (hourly.length === 0) return null;
    const peak = hourly.reduce((a, b) => (Number(b.count) > Number(a.count) ? b : a));
    if (Number(peak.count) <= 0) return null;
    return { icon: "⏰", observation: `${formatHourKR(peak.hour)}가 피크에요`, action: "이 시간에 콘텐츠를 올리면 효과적", priority: 50 };
  },
  function browserDominance({ browsers }) {
    const totalBr = browsers.reduce((s, b) => s + Number(b.count), 0);
    if (totalBr <= 0 || browsers.length === 0) return null;
    const top = browsers[0];
    if (Number(top.count) / totalBr < 0.8) return null;
    return { icon: "🌐", observation: `${top.browser}이 ${Math.round((Number(top.count) / totalBr) * 100)}%에요`, action: "다른 브라우저에서도 잘 되는지 확인하세요", priority: 45 };
  },
];

function generateTips(data: SiteData): Tip[] {
  const tips = TIP_RULES.map((rule) => rule(data)).filter((t): t is Tip => t !== null);
  tips.sort((a, b) => b.priority - a.priority);

  // 최소 2개 보장
  if (tips.length < 2) {
    tips.push({ icon: "💪", observation: "꾸준함이 최고의 전략이에요", action: "매일 조금씩 공유하면 1K는 시간문제에요", priority: 10 });
  }

  return tips.slice(0, 3);
}

export function CoachSection({ data }: { data: SiteData }) {
  const { daily } = data;
  const tips = useMemo(() => generateTips(data), [data]);

  // 성장 지표 계산
  const growth = useMemo(() => {
    if (daily.length < 7) return { label: "수집 중", color: "" };
    const recent = daily.slice(-7).reduce((s, d) => s + d.count, 0);
    if (daily.length < 14) return { label: `${recent.toLocaleString()}명`, color: "" };
    const prev = daily.slice(-14, -7).reduce((s, d) => s + d.count, 0);
    if (prev === 0) return { label: "첫 주!", color: "text-emerald-500" };
    const pct = Math.round(((recent - prev) / prev) * 100);
    return {
      label: `${pct >= 0 ? "+" : ""}${pct}%`,
      color: pct >= 0 ? "text-emerald-500" : "text-red-400",
    };
  }, [daily]);

  const bestDay = useMemo(() => {
    if (!daily.length) return null;
    const best = daily.reduce((a, b) => (b.count > a.count ? b : a));
    if (best.count === 0) return null;
    const d = new Date(best.date + "T00:00:00+09:00");
    return `${d.getMonth() + 1}/${d.getDate()} (${best.count.toLocaleString()}명)`;
  }, [daily]);

  const bestDow = useMemo(() => {
    if (daily.length < 7) return null;
    const sums: number[] = [0, 0, 0, 0, 0, 0, 0];
    const cnts: number[] = [0, 0, 0, 0, 0, 0, 0];
    daily.forEach((d) => {
      const day = new Date(d.date + "T00:00:00+09:00").getDay();
      sums[day] += d.count;
      cnts[day]++;
    });
    let maxAvg = 0, maxDay = 0;
    for (let i = 0; i < 7; i++) {
      const avg = cnts[i] ? sums[i] / cnts[i] : 0;
      if (avg > maxAvg) { maxAvg = avg; maxDay = i; }
    }
    return maxAvg > 0 ? `${KR_DAYS[maxDay]}요일` : null;
  }, [daily]);

  return (
    <div className="space-y-3">
      {/* 성장 지표 칩 */}
      <div className="flex gap-2">
        <div className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-2.5 py-2.5 text-center">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-0.5">이번 주</p>
          <p className={`text-[13px] font-bold ${growth.color || "text-zinc-700 dark:text-zinc-200"}`}>{growth.label}</p>
        </div>
        <div className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-2.5 py-2.5 text-center">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-0.5">최고의 날</p>
          <p className="text-[13px] font-bold text-zinc-700 dark:text-zinc-200 truncate">{bestDay ?? "–"}</p>
        </div>
        <div className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-2.5 py-2.5 text-center">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-0.5">베스트 요일</p>
          <p className="text-[13px] font-bold text-zinc-700 dark:text-zinc-200">{bestDow ?? "–"}</p>
        </div>
      </div>

      {/* 코칭 팁 */}
      <div className="space-y-2">
        {tips.map((tip, i) => (
          <div key={i} className="flex items-start gap-2.5 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl px-3 py-2.5">
            <span className="text-base shrink-0 mt-0.5">{tip.icon}</span>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-zinc-700 dark:text-zinc-200">{tip.observation}</p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{tip.action}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
