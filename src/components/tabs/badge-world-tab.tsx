"use client";

import { useState } from "react";
import { useConfetti } from "@/components/confetti";

const ACHIEVEMENT_BADGES = [
  {
    category: "1K 여정",
    desc: "0 → 1,000 방문자",
    items: [
      { icon: "🌱", name: "새싹", condition: "첫 방문자" },
      { icon: "🐣", name: "병아리", condition: "누적 10명" },
      { icon: "🔥", name: "불꽃", condition: "누적 50명" },
      { icon: "⭐", name: "스타", condition: "누적 100명" },
      { icon: "👑", name: "왕관", condition: "누적 250명" },
      { icon: "💎", name: "다이아", condition: "누적 500명" },
      { icon: "🏆", name: "트로피", condition: "누적 750명" },
      { icon: "🚀", name: "로켓", condition: "1K 달성!" },
    ],
  },
  {
    category: "10K 우주",
    desc: "1K → 10K 방문자",
    items: [
      { icon: "🛸", name: "UFO", condition: "누적 2,500명" },
      { icon: "🌕", name: "보름달", condition: "누적 5,000명" },
      { icon: "☄️", name: "혜성", condition: "누적 7,500명" },
      { icon: "🪐", name: "행성", condition: "10K 달성!" },
    ],
  },
  {
    category: "100K 은하",
    desc: "10K → 100K 방문자",
    items: [
      { icon: "🌌", name: "은하수", condition: "누적 25,000명" },
      { icon: "🔭", name: "망원경", condition: "누적 50,000명" },
      { icon: "🌠", name: "유성우", condition: "누적 75,000명" },
      { icon: "💫", name: "빅뱅", condition: "100K 달성!" },
    ],
  },
  {
    category: "1M 신화",
    desc: "100K → 1M 방문자",
    items: [
      { icon: "🏛️", name: "판테온", condition: "누적 250,000명" },
      { icon: "🗿", name: "모아이", condition: "누적 500,000명" },
      { icon: "⚜️", name: "레전드", condition: "누적 750,000명" },
      { icon: "👼", name: "신화", condition: "1M 달성!" },
    ],
  },
  {
    category: "주간 달성",
    desc: "이번 주 방문수 기준",
    items: [
      { icon: "🐢", name: "거북이", condition: "주간 1명" },
      { icon: "🐇", name: "토끼", condition: "주간 10명" },
      { icon: "🦅", name: "독수리", condition: "주간 50명" },
      { icon: "🐉", name: "용", condition: "주간 100명" },
      { icon: "🦖", name: "공룡", condition: "주간 500명" },
      { icon: "🐋", name: "대왕고래", condition: "주간 1,000명" },
    ],
  },
  {
    category: "일간 달성",
    desc: "오늘 방문수 기준",
    items: [
      { icon: "☀️", name: "맑음", condition: "오늘 1명" },
      { icon: "🌈", name: "무지개", condition: "오늘 10명" },
      { icon: "⚡", name: "번개", condition: "오늘 50명" },
      { icon: "🌋", name: "폭발", condition: "오늘 100명" },
      { icon: "🌪️", name: "토네이도", condition: "오늘 500명" },
      { icon: "☄️", name: "대폭발", condition: "오늘 1,000명" },
    ],
  },
  {
    category: "연속 기록",
    desc: "매일 방문자가 찾아오면",
    items: [
      { icon: "📅", name: "3일 연속", condition: "3일 연속 방문" },
      { icon: "🔥", name: "7일 연속", condition: "7일 연속 방문" },
      { icon: "💪", name: "14일 연속", condition: "2주 연속 방문" },
      { icon: "🎯", name: "30일 연속", condition: "한 달 연속 방문" },
      { icon: "🏅", name: "60일 연속", condition: "두 달 연속 방문" },
      { icon: "🐐", name: "100일 연속", condition: "100일 연속 방문!" },
      { icon: "♾️", name: "365일 연속", condition: "1년 개근!" },
    ],
  },
];

const GOAL_REWARDS = [
  {
    tier: "🚀 1K",
    color: "#ec4899",
    rewards: [
      { icon: "🏆", title: "1K 트로피 배지", desc: "대시보드에 영구 표시" },
      { icon: "🎨", title: "프리미엄 뱃지 스타일", desc: "골드 테마 해금" },
    ],
  },
  {
    tier: "🪐 10K",
    color: "#a855f7",
    rewards: [
      { icon: "📊", title: "상세 분석 리포트", desc: "월간 트렌드 분석" },
      { icon: "🌟", title: "탐색 상단 고정", desc: "스토어 추천 사이트" },
    ],
  },
  {
    tier: "💫 100K",
    color: "#3b82f6",
    rewards: [
      { icon: "🏅", title: "명예의 전당", desc: "100K 클럽 등재" },
      { icon: "✨", title: "커스텀 뱃지", desc: "나만의 SVG 디자인" },
    ],
  },
  {
    tier: "👼 1M",
    color: "#22c55e",
    rewards: [
      { icon: "🗿", title: "전설의 사이트", desc: "m1k 레전드 인증" },
      { icon: "🎭", title: "m1k 앰배서더", desc: "공식 파트너 배지" },
    ],
  },
];

export function BadgeWorldTab({ bgColor }: { bgColor: string }) {
  const fire = useConfetti();
  const [showRewards, setShowRewards] = useState(false);

  return (
    <div className="px-4 py-5">
      <h2 className="text-lg font-bold text-zinc-900 mb-1">배지 월드</h2>
      <p className="text-xs text-zinc-400 mb-6">
        방문자가 늘어날수록 새로운 배지를 획득해요
      </p>

      {/* 달성 보상 미리보기 */}
      <div className="mb-6">
        <button
          onClick={() => {
            fire();
            setShowRewards(!showRewards);
          }}
          className="w-full rounded-2xl p-5 text-center text-white transition-all active:scale-[0.98] relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${bgColor}, ${bgColor}dd)`,
          }}
        >
          <div className="relative z-10">
            <span className="text-3xl block mb-2">🚀</span>
            <p className="text-base font-black mb-1">달성하면 뭐가 열릴까?</p>
            <p className="text-[11px] opacity-80">눌러서 미리 체험해보세요</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]" style={{ animationName: "shimmer" }} />
        </button>

        {showRewards && (
          <div className="mt-3 space-y-4">
            {GOAL_REWARDS.map((goal) => (
              <div key={goal.tier}>
                <p className="text-xs font-bold mb-2" style={{ color: goal.color }}>
                  {goal.tier} 달성 보상
                </p>
                <div className="space-y-1.5">
                  {goal.rewards.map((r) => (
                    <div
                      key={r.title}
                      className="flex items-center gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3"
                    >
                      <span className="text-2xl">{r.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{r.title}</p>
                        <p className="text-[10px] text-zinc-400">{r.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 배지 갤러리 */}
      <div className="space-y-6">
        {ACHIEVEMENT_BADGES.map((group) => (
          <div key={group.category}>
            <div className="mb-3">
              <h3
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: bgColor }}
              >
                {group.category}
              </h3>
              <p className="text-[10px] text-zinc-400">{group.desc}</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {group.items.map((badge) => (
                <div
                  key={badge.name}
                  className="flex flex-col items-center rounded-xl bg-zinc-50 py-3 px-1 group relative"
                >
                  <span className="text-2xl mb-1">{badge.icon}</span>
                  <p className="text-[10px] font-semibold text-zinc-700">{badge.name}</p>
                  <p className="text-[8px] text-zinc-400">{badge.condition}</p>
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                    <div className="bg-zinc-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
                      {badge.condition}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
