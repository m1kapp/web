import { fetchRecentSites } from "@/lib/site-service";
import { redis } from "@/lib/redis";
import { handler, ok } from "@m1kapp/kit/server";

interface Bucket {
  files: number;
  codeLines: number;
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
  quality: { score: number; grade: string; branchDensity: number } | null;
  generatedAt: string | null;
}

const CACHE_KEY = "kit-stats:v3"; // v2: source.breakdown / v3: savedLines·savedFiles 추가
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
          ? { score: j.quality.score, grade: j.quality.grade, branchDensity: j.quality.branchDensity }
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
