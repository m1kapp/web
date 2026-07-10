import { fetchRecentSites } from "@/lib/site-service";
import { redis } from "@/lib/redis";
import { handler, ok } from "@m1kapp/kit/server";

interface Bucket {
  files: number;
  codeLines: number;
}

interface QualityWorstFn {
  name: string;
  cog: number;
  file: string;
  line: number;
}

interface QualityDupFile {
  file: string;
  dupTokens: number;
}

export interface SiteQuality {
  score: number;
  grade: string;
  engine: string | null;
  branchDensity: number;
  avgFileLines: number | null;
  longFiles: number | null;
  maxFile: { path: string; lines: number } | null;
  cognitive: { avg: number; max: number; over15: number; over25: number; worst: QualityWorstFn[] } | null;
  duplication: { percent: number; worstFiles: QualityDupFile[] } | null;
}

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
      return {
        slug: s.slug,
        kitVersion: j.kitVersion,
        files: j.source?.files ?? null,
        codeLines: j.source?.codeLines ?? null,
        breakdown: j.source?.breakdown ?? null,
        savedPercent: j.kit?.savedPercent ?? null,
        savedLines: j.kit?.savedLines ?? null,
        savedFiles: Array.isArray(j.kit?.features) ? j.kit.features.length : null,
        quality: j.quality
          ? {
              score: j.quality.score,
              grade: j.quality.grade,
              engine: j.quality.engine ?? null,
              branchDensity: j.quality.branchDensity,
              avgFileLines: j.quality.avgFileLines ?? null,
              longFiles: j.quality.longFiles ?? null,
              maxFile: j.quality.maxFile ?? null,
              cognitive: j.quality.cognitive
                ? {
                    avg: j.quality.cognitive.avg,
                    max: j.quality.cognitive.max,
                    over15: j.quality.cognitive.over15,
                    over25: j.quality.cognitive.over25,
                    worst: (j.quality.cognitive.worst ?? []).slice(0, 5),
                  }
                : null,
              duplication: j.quality.duplication
                ? {
                    percent: j.quality.duplication.percent,
                    worstFiles: (j.quality.duplication.worstFiles ?? []).slice(0, 3),
                  }
                : null,
            }
          : null,
        generatedAt: j.generatedAt ?? null,
      };
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
