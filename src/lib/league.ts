/**
 * 리그 — 1K를 시작으로 10K, 100K, 1M까지 이어지는 성장 단계.
 *
 * 1,000명을 넘긴 사이트를 계속 "47%… 4700%"로 두면 눈금이 무의미해진다.
 * 넘긴 사이트는 다음 리그로 올려보내고, 진행률은 그 리그 안에서 다시 0부터 잰다.
 */
export const LEAGUE_TARGETS = [1_000, 10_000, 100_000, 1_000_000] as const;

export type League = {
  /** 이 리그의 목표 방문 수. 1M까지 다 넘겼으면 null */
  target: number | null;
  /** 리그 시작선 — 직전 리그의 목표 */
  floor: number;
  /** "1K" · "10K" · "100K" · "1M" · "1M+" */
  label: string;
  /** 리그 안에서의 진행률 0~1. 최상위 리그를 졸업했으면 1 */
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
    progress: Math.max(0, Math.min(1, (total - floor) / (target - floor))),
    rank: index,
  };
}

/** 상위 리그 먼저, 같은 리그 안에서는 많이 모은 순 */
export function groupByLeague<T extends { total: number }>(sites: T[]) {
  const groups = new Map<number, { league: League; sites: T[] }>();

  for (const site of sites) {
    const league = leagueOf(site.total);
    const group = groups.get(league.rank) ?? { league, sites: [] };
    group.sites.push(site);
    groups.set(league.rank, group);
  }

  return [...groups.values()]
    .sort((a, b) => b.league.rank - a.league.rank)
    .map((g) => ({ ...g, sites: g.sites.sort((a, b) => b.total - a.total) }));
}
