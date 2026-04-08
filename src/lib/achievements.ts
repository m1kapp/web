export interface Achievement {
  icon: string;
  name: string;
  condition: string;
  type: "total" | "weekly" | "daily" | "special";
  threshold: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // 누적
  { icon: "🌱", name: "새싹", condition: "첫 방문자", type: "total", threshold: 1 },
  { icon: "🐣", name: "병아리", condition: "누적 10명", type: "total", threshold: 10 },
  { icon: "🔥", name: "불꽃", condition: "누적 50명", type: "total", threshold: 50 },
  { icon: "⭐", name: "스타", condition: "누적 100명", type: "total", threshold: 100 },
  { icon: "👑", name: "왕관", condition: "누적 250명", type: "total", threshold: 250 },
  { icon: "💎", name: "다이아", condition: "누적 500명", type: "total", threshold: 500 },
  { icon: "🏆", name: "트로피", condition: "누적 750명", type: "total", threshold: 750 },
  { icon: "🚀", name: "로켓", condition: "1K 달성!", type: "total", threshold: 1000 },
  // 주간
  { icon: "🐢", name: "거북이", condition: "주간 1명", type: "weekly", threshold: 1 },
  { icon: "🐇", name: "토끼", condition: "주간 10명", type: "weekly", threshold: 10 },
  { icon: "🦅", name: "독수리", condition: "주간 50명", type: "weekly", threshold: 50 },
  { icon: "🐉", name: "용", condition: "주간 100명", type: "weekly", threshold: 100 },
  // 일간
  { icon: "☀️", name: "맑음", condition: "오늘 1명", type: "daily", threshold: 1 },
  { icon: "🌈", name: "무지개", condition: "오늘 10명", type: "daily", threshold: 10 },
  { icon: "⚡", name: "번개", condition: "오늘 50명", type: "daily", threshold: 50 },
  { icon: "🌋", name: "폭발", condition: "오늘 100명", type: "daily", threshold: 100 },
];

export interface SiteCounts {
  total: number;
  weekly: number;
  daily: number;
}

export function getUnlockedAchievements(counts: SiteCounts): Achievement[] {
  return ACHIEVEMENTS.filter((a) => {
    if (a.type === "total") return counts.total >= a.threshold;
    if (a.type === "weekly") return counts.weekly >= a.threshold;
    if (a.type === "daily") return counts.daily >= a.threshold;
    return false;
  });
}

export function getLockedAchievements(counts: SiteCounts): Achievement[] {
  return ACHIEVEMENTS.filter((a) => {
    if (a.type === "total") return counts.total < a.threshold;
    if (a.type === "weekly") return counts.weekly < a.threshold;
    if (a.type === "daily") return counts.daily < a.threshold;
    return true;
  });
}
