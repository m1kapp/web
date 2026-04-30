import { NextRequest } from "next/server";
import { generateBadge } from "@/lib/badge";
import { findSiteBySlug, recordMilestoneIfReached } from "@/lib/site-service";
import {
  bufferHit, getBufferedCount, getBufferedTotal,
  getCachedSite, cacheSite, getCountSnapshot, queueVerify,
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
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const today = todayKST();
    const salt = process.env.IP_HASH_SALT || "m1k-default-salt";
    const ipHash = createHash("sha256")
      .update(`${ip}:${site.id}:${today}:${salt}`)
      .digest("hex");

    const country = request.headers.get("x-vercel-ip-country") || null;
    const city = request.headers.get("x-vercel-ip-city") || null;

    const ua = request.headers.get("user-agent") || "";
    const device = /mobile|android|iphone/i.test(ua)
      ? "mobile"
      : /tablet|ipad/i.test(ua)
        ? "tablet"
        : "desktop";
    const browser = parseBrowser(ua);
    const os = parseOS(ua);
    const referer = request.headers.get("referer") || null;

    const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const hourKST = nowKST.getUTCHours();

    const isNew = await bufferHit({
      siteId: site.id, ipHash, country, city, device, browser, os, referer,
      date: today, hourKST,
    });

    // verify 체크 → 사이트당 1회뿐이므로 즉시 처리
    if (isNew && !site.verified && referer && site.url) {
      try {
        const refererHost = new URL(referer).hostname;
        const siteHost = new URL(site.url).hostname;
        if (refererHost === siteHost || refererHost.endsWith(`.${siteHost}`)) {
          const { db } = await import("@/lib/db");
          const { sites } = await import("@/lib/db/schema");
          const { eq } = await import("drizzle-orm");
          await db.update(sites).set({ verified: true }).where(eq(sites.id, site.id));
          site = { ...site, verified: true };
          await cacheSite(slug, site);
        }
      } catch { /* ignore */ }
    }
  }

  // 2) 카운트: KV 스냅샷 + 버퍼 증분 (Neon 안 침)
  const todayStr = todayKST();
  const [snapshot, bufferedToday, bufferedTotal] = await Promise.all([
    getCountSnapshot(site.id),
    getBufferedCount(site.id, todayStr),
    getBufferedTotal(site.id),
  ]);

  const base: CountSnapshot = snapshot ?? { total: site.totalHits, today: 0, weekly: 0, monthly: 0, updatedAt: "" };

  const counts = {
    total: base.total + bufferedTotal,
    today: base.today + bufferedToday,
    weekly: base.weekly + bufferedToday,
    monthly: base.monthly + bufferedToday,
  };

  const rawType = urlObj.searchParams.get("type") ?? "total";
  const badgeType: BadgeType = (VALID_BADGE_TYPES as readonly string[]).includes(rawType)
    ? rawType as BadgeType
    : "total";
  const displayCount = counts[badgeType] ?? counts.total;

  const typeLabels: Record<string, string> = {
    total: urlObj.searchParams.get("label") || site.badgeLabel || "m1k",
    today: urlObj.searchParams.get("label") || "today",
    weekly: urlObj.searchParams.get("label") || "weekly",
    monthly: urlObj.searchParams.get("label") || "monthly",
  };

  const currentGoal = getCurrentGoal(counts.total);
  const svg = generateBadge(displayCount, currentGoal.goal, {
    label: typeLabels[badgeType] || "m1k",
    color: urlObj.searchParams.get("color")
      ? `#${urlObj.searchParams.get("color")}`
      : site.badgeColor ? `#${site.badgeColor}` : site.color || "#000000",
    labelColor: urlObj.searchParams.get("labelColor")
      ? `#${urlObj.searchParams.get("labelColor")}`
      : undefined,
    style: (urlObj.searchParams.get("style") || site.badgeStyle || "cyworld") as "flat" | "flat-square" | "rounded" | "cyworld",
    theme: isDark ? "dark" : "light",
  }, counts.today);

  const maxAge = viewOnly ? 30 : 5;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=60`,
      "ETag": `"${counts.total}-${counts.today}"`,
    },
  });
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
