import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sites, hits, hitLogs, dailyGeoStats, dailyDeviceStats, dailyHourStats } from "@/lib/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import { generateBadge } from "@/lib/badge";
import { findSiteBySlug, recordMilestoneIfReached } from "@/lib/site-service";

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
import { createHash } from "crypto";
import { todayKST } from "@/lib/format";

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

  let site = await findSiteBySlug(slug);

  if (!site) {
    return new Response("Not found", { status: 404 });
  }

  // ?view=true → 조회 전용 (카운트 안 올림)
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

    const existing = await db.query.hitLogs.findFirst({
      where: and(
        eq(hitLogs.siteId, site.id),
        eq(hitLogs.ipHash, ipHash)
      ),
    });

    if (!existing) {
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

      // KST 기준 시간 (사전집계 테이블용)
      const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000);
      const hourKST = nowKST.getUTCHours();

      // 모든 hit 기록 + 사전집계 업데이트를 단일 Promise.all로
      await Promise.all([
        db.insert(hitLogs).values({ siteId: site.id, ipHash, country, city, device, browser, os, referer }),
        db.insert(hits).values({ siteId: site.id, date: today, count: 1 })
          .onConflictDoUpdate({ target: [hits.siteId, hits.date], set: { count: sql`${hits.count} + 1` } }),
        db.update(sites).set({ totalHits: sql`${sites.totalHits} + 1` }).where(eq(sites.id, site.id)),
        db.insert(dailyGeoStats).values({ siteId: site.id, date: today, country: country ?? "", city: city ?? "" })
          .onConflictDoUpdate({
            target: [dailyGeoStats.siteId, dailyGeoStats.date, dailyGeoStats.country, dailyGeoStats.city],
            set: { count: sql`${dailyGeoStats.count} + 1` },
          }),
        db.insert(dailyDeviceStats).values({ siteId: site.id, date: today, device, browser, os })
          .onConflictDoUpdate({
            target: [dailyDeviceStats.siteId, dailyDeviceStats.date, dailyDeviceStats.device, dailyDeviceStats.browser, dailyDeviceStats.os],
            set: { count: sql`${dailyDeviceStats.count} + 1` },
          }),
        db.insert(dailyHourStats).values({ siteId: site.id, date: today, hour: hourKST })
          .onConflictDoUpdate({
            target: [dailyHourStats.siteId, dailyHourStats.date, dailyHourStats.hour],
            set: { count: sql`${dailyHourStats.count} + 1` },
          }),
      ]);

      // Referer가 등록된 사이트 도메인과 일치하면 → 인증 완료
      if (!site.verified && referer && site.url) {
        try {
          const refererHost = new URL(referer).hostname;
          const siteHost = new URL(site.url).hostname;
          if (refererHost === siteHost || refererHost.endsWith(`.${siteHost}`)) {
            await db.update(sites).set({ verified: true }).where(eq(sites.id, site.id));
            site = { ...site, verified: true };
          }
        } catch (e) { console.error("[badge] verify check failed:", e); }
      }
    }
  }

  const now = new Date();
  const todayStr = todayKST(now);

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  // total은 사전집계된 sites.totalHits 사용 (SUM 쿼리 제거)
  const [[todayR], [weeklyR], [monthlyR]] = await Promise.all([
    db.select({ v: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, site.id), eq(hits.date, todayStr))),
    db.select({ v: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, site.id), gte(hits.date, todayKST(weekAgo)))),
    db.select({ v: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, site.id), gte(hits.date, todayKST(monthAgo)))),
  ]);

  const counts = {
    total: site.totalHits,
    today: Number(todayR.v),
    weekly: Number(weeklyR.v),
    monthly: Number(monthlyR.v),
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

  await recordMilestoneIfReached(site, counts.total);

  const currentGoal = getCurrentGoal(counts.total);
  const svg = generateBadge(displayCount, currentGoal.goal, {
    label: typeLabels[badgeType] || "m1k",
    color: urlObj.searchParams.get("color")
      ? `#${urlObj.searchParams.get("color")}`
      : site.color || undefined,
    labelColor: urlObj.searchParams.get("labelColor")
      ? `#${urlObj.searchParams.get("labelColor")}`
      : undefined,
    style: (urlObj.searchParams.get("style") || site.badgeStyle || "flat") as "flat" | "flat-square" | "rounded" | "cyworld",
    theme: isDark ? "dark" : "light",
  }, counts.today);

  // 조회 전용은 30초 캐시, 카운트용은 5초
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
