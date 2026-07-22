import { fetchRecentSites } from "@/lib/site-service";
import { redis } from "@/lib/redis";
import { handler, ok } from "@m1kapp/kit/server";
import type { Bucket, QualityWorstFn, QualityDupFile, SiteQuality } from "@/lib/kit-stats-types";

export type { SiteQuality };

export interface SiteKitStats {
  slug: string;
  kitVersion: string;
  files: number | null;
  codeLines: number | null;
  breakdown: { frontend: Bucket; backend: Bucket; shared: Bucket } | null;
  savedPercent: number | null;
  savedLines: number | null;
  savedFiles: number | null; // kit 요소 소스 파일 수 = 안 썼으면 직접 만들었을 파일 근사치
  quality: SiteQuality | null;
  generatedAt: string | null;
}

const CACHE_KEY = "kit-stats:v4"; // v2: source.breakdown / v3: savedLines·savedFiles / v4: quality 상세(cognitive·duplication·avgFileLines) 추가
const CACHE_TTL = 3600; // 1h — 각 사이트의 정적 kit-stats.json이라 잦은 갱신 불필요

// 원격 kit-stats.json(느슨한 형태) → 우리 SiteQuality 스키마로 정규화
function normalizeQuality(q: Record<string, unknown> | null | undefined): SiteQuality | null {
  if (!q) return null;
  const cog = q.cognitive as Record<string, unknown> | undefined;
  const dup = q.duplication as Record<string, unknown> | undefined;
  return {
    score: q.score as number,
    grade: q.grade as string,
    engine: (q.engine as string) ?? null,
    branchDensity: q.branchDensity as number,
    avgFileLines: (q.avgFileLines as number) ?? null,
    longFiles: (q.longFiles as number) ?? null,
    maxFile: (q.maxFile as SiteQuality["maxFile"]) ?? null,
    cognitive: cog
      ? {
          avg: cog.avg as number,
          max: cog.max as number,
          over15: cog.over15 as number,
          over25: cog.over25 as number,
          worst: ((cog.worst as QualityWorstFn[]) ?? []).slice(0, 5),
        }
      : null,
    duplication: dup
      ? {
          percent: dup.percent as number,
          worstFiles: ((dup.worstFiles as QualityDupFile[]) ?? []).slice(0, 3),
        }
      : null,
  };
}

// 원격 kit-stats.json → 우리 응답용 SiteKitStats로 정규화
function normalizeSiteStats(slug: string, j: Record<string, unknown>): SiteKitStats {
  const source = j.source as Record<string, unknown> | undefined;
  const kit = j.kit as Record<string, unknown> | undefined;
  return {
    slug,
    kitVersion: j.kitVersion as string,
    files: (source?.files as number) ?? null,
    codeLines: (source?.codeLines as number) ?? null,
    breakdown: (source?.breakdown as SiteKitStats["breakdown"]) ?? null,
    savedPercent: (kit?.savedPercent as number) ?? null,
    savedLines: (kit?.savedLines as number) ?? null,
    savedFiles: Array.isArray(kit?.features) ? (kit!.features as unknown[]).length : null,
    quality: normalizeQuality(j.quality as Record<string, unknown> | null | undefined),
    generatedAt: (j.generatedAt as string) ?? null,
  };
}

// 등록 사이트들의 /kit-stats.json을 수집해 kit 버전·규모·청결도를 한 번에 반환.
// 스토어 dev 모드 비교용.
export const GET = handler(async (req) => {
  const force = new URL(req.url).searchParams.get("refresh") === "1";

  if (!force && redis) {
    const cached = await redis.get(CACHE_KEY);
    if (cached) return ok(cached);
  }

  const [sites, latest] = await Promise.all([
    fetchRecentSites(),
    fetch("https://registry.npmjs.org/@m1kapp/kit/latest", {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null),
  ]);

  const results = await Promise.allSettled(
    sites.slice(0, 60).map(async (s): Promise<SiteKitStats | null> => {
      if (!s.url) return null;
      const res = await fetch(`${s.url.replace(/\/$/, "")}/kit-stats.json`, {
        signal: AbortSignal.timeout(4000),
        cache: "no-store",
      });
      if (!res.ok) return null;
      const j = await res.json();
      if (!j?.kitVersion) return null;
      return normalizeSiteStats(s.slug, j);
    })
  );

  const stats: Record<string, SiteKitStats> = {};
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) stats[r.value.slug] = r.value;
  }

  const payload = {
    latestKitVersion: latest?.version ?? null,
    fetchedAt: new Date().toISOString(),
    stats,
  };

  if (redis) await redis.set(CACHE_KEY, payload, { ex: CACHE_TTL });
  return ok(payload);
});
