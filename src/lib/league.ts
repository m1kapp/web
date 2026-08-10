/**
 * 리그 — 1K를 시작으로 10K, 100K, 1M까지 이어지는 성장 단계.
 *
 * 1,000명을 넘긴 사이트를 계속 "4700%"로 두면 눈금이 무의미해지므로 다음 리그로 올려보낸다.
 *
 * 진행률은 "리그 안에서 얼마나 왔나"가 아니라 누적 그대로 목표 대비로 잰다.
 * 리그 시작선을 빼서 재면(31,658 - 10,000) 화면에 누적과 다른 숫자가 하나 더 생기는데,
 * 그 둘의 차이는 설명 없이는 안 읽힌다. 목표 대비면 "32k / 100K"로 끝난다.
 */
export const LEAGUE_TARGETS = [1_000, 10_000, 100_000, 1_000_000] as const;

export type League = {
  /** 이 리그의 목표 방문 수. 1M까지 다 넘겼으면 null */
  target: number | null;
  /** 리그 시작선 — 직전 리그의 목표. 정렬·분류용이고 진행률 계산에는 안 쓴다 */
  floor: number;
  /** "1K" · "10K" · "100K" · "1M" · "1M+" */
  label: string;
  /** 다음 목표 대비 진행률 0~1. 최상위 리그를 졸업했으면 1 */
  progress: number;
  /** 정렬용 — 높을수록 상위 리그 */
  rank: number;
};

const format = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : `${n / 1_000}K`);

export function leagueOf(total: number): League {
  const index = LEAGUE_TARGETS.findIndex((t) => total < t);

  // 1M까지 전부 넘긴 사이트 — 더 올려보낼 리그가 없다
  if (index === -1) {
    const top = LEAGUE_TARGETS[LEAGUE_TARGETS.length - 1];
    return { target: null, floor: top, label: `${format(top)}+`, progress: 1, rank: LEAGUE_TARGETS.length };
  }

  const target = LEAGUE_TARGETS[index];
  const floor = index === 0 ? 0 : LEAGUE_TARGETS[index - 1];
  return {
    target,
    floor,
    label: format(target),
    progress: Math.max(0, Math.min(1, total / target)),
    rank: index,
  };
}
