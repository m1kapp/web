import { NextRequest } from "next/server";
import { generateBadge } from "@/lib/badge";
import { findSiteBySlug } from "@/lib/site-service";
import {
  bufferHit, getBufferedCount, getBufferedTotal,
  getCachedSite, cacheSite, getCountSnapshot,
  type CountSnapshot,
} from "@/lib/hit-buffer";
import { createHash } from "crypto";
import { todayKST } from "@/lib/format";
import type { Site } from "@/lib/site-service";

const GOAL_TIERS = [
  { goal: 1_000, label: "1K" },
  { goal: 10_000, label: "10K" },
  { goal: 100_000, label: "100K" },
  { goal: 1_000_000, label: "1M" },
];
function getCurrentGoal(total: number) {
  for (const tier of GOAL_TIERS) {
    if (total < tier.goal) return tier;
  }
  return GOAL_TIERS[GOAL_TIERS.length - 1];
}

export const runtime = "nodejs";

const VALID_BADGE_TYPES = ["total", "today", "weekly", "monthly"] as const;
type BadgeType = typeof VALID_BADGE_TYPES[number];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug: slugParts } = await params;
  const joined = slugParts.join("/").replace(/\.svg$/, "");
  const isDark = joined.endsWith("-dark");
  const slug = (isDark ? joined.slice(0, -5) : joined).trim();

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  // 1) site 조회: KV 캐시 → miss면 Neon fallback + 캐싱
  let site = await getCachedSite<Site>(slug);
  if (!site) {
    site = (await findSiteBySlug(slug)) ?? null;
    if (!site) return new Response("Not found", { status: 404 });
    await cacheSite(slug, site);
  }

  const urlObj = new URL(request.url);
  const viewOnly = urlObj.searchParams.get("view") === "true";

  if (!viewOnly) {
    site = await recordHit(request, site, slug);
  }

  // 2) 카운트: KV 스냅샷 + 버퍼 증분 (Neon 안 침)
  const counts = await resolveCounts(site);

  const svg = generateBadge(...buildBadgeArgs(urlObj, site, counts, isDark));

  const maxAge = viewOnly ? 30 : 5;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=60`,
      "ETag": `"${counts.total}-${counts.today}"`,
    },
  });
}

/** 히트 버퍼링 + (첫 유입이면) referer 기반 사이트 인증. 인증되면 갱신된 site 반환 */
async function recordHit(request: NextRequest, site: Site, slug: string): Promise<Site> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const today = todayKST();
  const salt = process.env.IP_HASH_SALT || "m1k-default-salt";
  const ipHash = createHash("sha256")
    .update(`${ip}:${site.id}:${today}:${salt}`)
    .digest("hex");

  const ua = request.headers.get("user-agent") || "";
  const referer = request.headers.get("referer") || null;
  const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000);

  const isNew = await bufferHit({
    siteId: site.id,
    ipHash,
    country: request.headers.get("x-vercel-ip-country") || null,
    city: request.headers.get("x-vercel-ip-city") || null,
    device: parseDevice(ua),
    browser: parseBrowser(ua),
    os: parseOS(ua),
    referer,
    date: today,
    hourKST: nowKST.getUTCHours(),
  });

  // verify 체크 → 사이트당 1회뿐이므로 즉시 처리
  if (isNew && !site.verified && referer && site.url) {
    return verifyByReferer(site, slug, referer);
  }
  return site;
}

/** referer 호스트가 사이트 호스트(또는 서브도메인)면 verified 처리 */
async function verifyByReferer(site: Site, slug: string, referer: string): Promise<Site> {
  try {
    const refererHost = new URL(referer).hostname;
    const siteHost = new URL(site.url!).hostname;
    if (refererHost !== siteHost && !refererHost.endsWith(`.${siteHost}`)) return site;

    const { db } = await import("@/lib/db");
    const { sites } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    await db.update(sites).set({ verified: true }).where(eq(sites.id, site.id));
    const updated = { ...site, verified: true };
    await cacheSite(slug, updated);
    return updated;
  } catch {
    return site;
  }
}

/** KV 스냅샷 + 버퍼 증분 병합 카운트 */
async function resolveCounts(site: Site) {
  const todayStr = todayKST();
  const [snapshot, bufferedToday, bufferedTotal] = await Promise.all([
    getCountSnapshot(site.id),
    getBufferedCount(site.id, todayStr),
    getBufferedTotal(site.id),
  ]);

  const base: CountSnapshot = snapshot ?? { total: site.totalHits, today: 0, weekly: 0, monthly: 0, updatedAt: "" };

  return {
    total: base.total + bufferedTotal,
    today: base.today + bufferedToday,
    weekly: base.weekly + bufferedToday,
    monthly: base.monthly + bufferedToday,
  };
}

/** 쿼리 파라미터·사이트 설정에서 generateBadge 인자 구성 */
function buildBadgeArgs(
  urlObj: URL,
  site: Site,
  counts: { total: number; today: number; weekly: number; monthly: number },
  isDark: boolean
): Parameters<typeof generateBadge> {
  const rawType = urlObj.searchParams.get("type") ?? "total";
  const badgeType: BadgeType = (VALID_BADGE_TYPES as readonly string[]).includes(rawType)
    ? rawType as BadgeType
    : "total";
  const displayCount = counts[badgeType] ?? counts.total;

  const currentGoal = getCurrentGoal(counts.total);
  const labelColorParam = urlObj.searchParams.get("labelColor");

  return [displayCount, currentGoal.goal, {
    label: resolveBadgeLabel(urlObj, site, badgeType),
    color: resolveBadgeColor(urlObj, site),
    labelColor: labelColorParam ? `#${labelColorParam}` : undefined,
    style: (urlObj.searchParams.get("style") || site.badgeStyle || "cyworld") as "flat" | "flat-square" | "rounded" | "cyworld",
    theme: isDark ? "dark" : "light",
  }, counts.today];
}

/** 우선순위: 쿼리 label → (total이면 site.badgeLabel) → 타입 기본 라벨 */
function resolveBadgeLabel(urlObj: URL, site: Site, badgeType: BadgeType): string {
  const queryLabel = urlObj.searchParams.get("label");
  if (queryLabel) return queryLabel;
  if (badgeType === "total") return site.badgeLabel || "m1k";
  return badgeType; // today/weekly/monthly는 타입명 그대로
}

/** 우선순위: 쿼리 color → site.badgeColor → site.color → 검정 */
function resolveBadgeColor(urlObj: URL, site: Site): string {
  const queryColor = urlObj.searchParams.get("color");
  if (queryColor) return `#${queryColor}`;
  if (site.badgeColor) return `#${site.badgeColor}`;
  return site.color || "#000000";
}

function parseDevice(ua: string): string {
  if (/mobile|android|iphone/i.test(ua)) return "mobile";
  if (/tablet|ipad/i.test(ua)) return "tablet";
  return "desktop";
}

function parseBrowser(ua: string): string {
  if (/edg/i.test(ua)) return "Edge";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  if (/opera|opr/i.test(ua)) return "Opera";
  return "Other";
}

function parseOS(ua: string): string {
  if (/windows/i.test(ua)) return "Windows";
  if (/macintosh|mac os/i.test(ua)) return "macOS";
  if (/iphone|ipad/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}
