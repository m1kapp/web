export interface Achievement {
  icon: string;
  name: string;
  condition: string;
  type: "total" | "weekly" | "daily" | "streak";
  threshold: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // 누적 — 1K까지
  { icon: "🌱", name: "새싹", condition: "첫 방문자", type: "total", threshold: 1 },
  { icon: "🐣", name: "병아리", condition: "누적 10명", type: "total", threshold: 10 },
  { icon: "🔥", name: "불꽃", condition: "누적 50명", type: "total", threshold: 50 },
  { icon: "⭐", name: "스타", condition: "누적 100명", type: "total", threshold: 100 },
  { icon: "👑", name: "왕관", condition: "누적 250명", type: "total", threshold: 250 },
  { icon: "💎", name: "다이아", condition: "누적 500명", type: "total", threshold: 500 },
  { icon: "🏆", name: "트로피", condition: "누적 750명", type: "total", threshold: 750 },
  { icon: "🚀", name: "로켓", condition: "1K 달성!", type: "total", threshold: 1000 },
  // 누적 — 10K까지
  { icon: "🛸", name: "UFO", condition: "누적 2,500명", type: "total", threshold: 2500 },
  { icon: "🌕", name: "보름달", condition: "누적 5,000명", type: "total", threshold: 5000 },
  { icon: "☄️", name: "혜성", condition: "누적 7,500명", type: "total", threshold: 7500 },
  { icon: "🪐", name: "행성", condition: "10K 달성!", type: "total", threshold: 10000 },
  // 누적 — 100K까지
  { icon: "🌌", name: "은하수", condition: "누적 25,000명", type: "total", threshold: 25000 },
  { icon: "🔭", name: "망원경", condition: "누적 50,000명", type: "total", threshold: 50000 },
  { icon: "🌠", name: "유성우", condition: "누적 75,000명", type: "total", threshold: 75000 },
  { icon: "💫", name: "빅뱅", condition: "100K 달성!", type: "total", threshold: 100000 },
  // 누적 — 1M
  { icon: "🏛️", name: "판테온", condition: "누적 250,000명", type: "total", threshold: 250000 },
  { icon: "🗿", name: "모아이", condition: "누적 500,000명", type: "total", threshold: 500000 },
  { icon: "⚜️", name: "레전드", condition: "누적 750,000명", type: "total", threshold: 750000 },
  { icon: "👼", name: "신화", condition: "1M 달성!", type: "total", threshold: 1000000 },
  // 주간
  { icon: "🐢", name: "거북이", condition: "주간 1명", type: "weekly", threshold: 1 },
  { icon: "🐇", name: "토끼", condition: "주간 10명", type: "weekly", threshold: 10 },
  { icon: "🦅", name: "독수리", condition: "주간 50명", type: "weekly", threshold: 50 },
  { icon: "🐉", name: "용", condition: "주간 100명", type: "weekly", threshold: 100 },
  { icon: "🦖", name: "공룡", condition: "주간 500명", type: "weekly", threshold: 500 },
  { icon: "🐋", name: "대왕고래", condition: "주간 1,000명", type: "weekly", threshold: 1000 },
  // 일간
  { icon: "☀️", name: "맑음", condition: "오늘 1명", type: "daily", threshold: 1 },
  { icon: "🌈", name: "무지개", condition: "오늘 10명", type: "daily", threshold: 10 },
  { icon: "⚡", name: "번개", condition: "오늘 50명", type: "daily", threshold: 50 },
  { icon: "🌋", name: "폭발", condition: "오늘 100명", type: "daily", threshold: 100 },
  { icon: "🌪️", name: "토네이도", condition: "오늘 500명", type: "daily", threshold: 500 },
  { icon: "☄️", name: "대폭발", condition: "오늘 1,000명", type: "daily", threshold: 1000 },
  // 스트릭
  { icon: "📅", name: "3일 연속", condition: "3일 연속 방문", type: "streak", threshold: 3 },
  { icon: "🔥", name: "7일 연속", condition: "7일 연속 방문", type: "streak", threshold: 7 },
  { icon: "💪", name: "14일 연속", condition: "2주 연속 방문", type: "streak", threshold: 14 },
  { icon: "🎯", name: "30일 연속", condition: "한 달 연속 방문", type: "streak", threshold: 30 },
  { icon: "🏅", name: "60일 연속", condition: "두 달 연속 방문", type: "streak", threshold: 60 },
  { icon: "🐐", name: "100일 연속", condition: "100일 연속 방문!", type: "streak", threshold: 100 },
  { icon: "♾️", name: "365일 연속", condition: "1년 개근!", type: "streak", threshold: 365 },
];

export interface SiteCounts {
  total: number;
  weekly: number;
  daily: number;
  streak?: number;
}

// 현재 목표 단계 계산
export const GOAL_TIERS = [
  { goal: 1_000, label: "1K", emoji: "🚀" },
  { goal: 10_000, label: "10K", emoji: "🪐" },
  { goal: 100_000, label: "100K", emoji: "💫" },
  { goal: 1_000_000, label: "1M", emoji: "👼" },
];

export function getCurrentGoal(total: number) {
  for (const tier of GOAL_TIERS) {
    if (total < tier.goal) return tier;
  }
  return GOAL_TIERS[GOAL_TIERS.length - 1];
}

function matchAchievement(a: Achievement, counts: SiteCounts): boolean {
  if (a.type === "total") return counts.total >= a.threshold;
  if (a.type === "weekly") return counts.weekly >= a.threshold;
  if (a.type === "daily") return counts.daily >= a.threshold;
  if (a.type === "streak") return (counts.streak ?? 0) >= a.threshold;
  return false;
}

export function getUnlockedAchievements(counts: SiteCounts): Achievement[] {
  return ACHIEVEMENTS.filter((a) => matchAchievement(a, counts));
}

// 오늘부터 과거로 연속 방문일 계산
export function calcStreak(daily: { date: string; count: number }[]): number {
  if (daily.length === 0) return 0;

  const dates = new Set(daily.filter((d) => d.count > 0).map((d) => d.date));
  const today = new Date();
  let streak = 0;

  // 오늘 또는 어제부터 시작 (오늘 아직 방문 없을 수 있으니)
  const todayStr = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let startFound = false;
  if (dates.has(todayStr)) {
    startFound = true;
  } else if (dates.has(yesterdayStr)) {
    startFound = true;
  }

  if (!startFound) return 0;

  // 오늘부터 역순으로
  const cursor = new Date(dates.has(todayStr) ? todayStr : yesterdayStr);
  while (true) {
    const key = cursor.toISOString().split("T")[0];
    if (dates.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function getLockedAchievements(counts: SiteCounts): Achievement[] {
  return ACHIEVEMENTS.filter((a) => !matchAchievement(a, counts));
}
