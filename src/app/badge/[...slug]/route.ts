import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sites, hits, hitLogs } from "@/lib/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import { generateBadge } from "@/lib/badge";
import { getCurrentGoal } from "@/lib/achievements";
import { findSiteBySlug } from "@/lib/site-service";
import { createHash } from "crypto";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug: slugParts } = await params;
  const rawSlug = slugParts.join("/").replace(/\.svg$/, "");
  const slug = rawSlug.trim();

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  // 사이트 조회 (short code 기반)
  let site = await findSiteBySlug(slug);

  if (!site) {
    return new Response("Not found", { status: 404 });
  }

  // ?view=true → 조회 전용 (카운트 안 올림)
  const urlObj = new URL(request.url);
  const viewOnly = urlObj.searchParams.get("view") === "true";

  if (!viewOnly) {
    // IP 해시 생성 (일별 중복 제거)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const today = new Date().toISOString().split("T")[0];
    const salt = process.env.IP_HASH_SALT || "m1k-default-salt";
    const ipHash = createHash("sha256")
      .update(`${ip}:${site.id}:${today}:${salt}`)
      .digest("hex");

    // 이미 오늘 방문했는지 확인
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

      await db.insert(hitLogs).values({
        siteId: site.id,
        ipHash,
        country,
        city,
        device,
        browser,
        os,
        referer,
      });

      await db
        .insert(hits)
        .values({ siteId: site.id, date: today, count: 1 })
        .onConflictDoUpdate({
          target: [hits.siteId, hits.date],
          set: { count: sql`${hits.count} + 1` },
        });

      // Referer가 등록된 사이트 도메인과 일치하면 → 인증 완료
      if (!site.verified && referer && site.url) {
        try {
          const refererHost = new URL(referer).hostname;
          const siteHost = new URL(site.url).hostname;
          if (refererHost === siteHost || refererHost.endsWith(`.${siteHost}`)) {
            await db.update(sites).set({ verified: true }).where(eq(sites.id, site.id));
            site = { ...site, verified: true };
          }
        } catch {}
      }
    }
  }

  // 기간별 방문수 조회
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [[totalR], [todayR], [weeklyR], [monthlyR]] = await Promise.all([
    db.select({ v: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(eq(hits.siteId, site.id)),
    db.select({ v: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, site.id), eq(hits.date, todayStr))),
    db.select({ v: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, site.id), gte(hits.date, weekAgo.toISOString().split("T")[0]))),
    db.select({ v: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, site.id), gte(hits.date, monthAgo.toISOString().split("T")[0]))),
  ]);

  const counts = {
    total: Number(totalR.v),
    today: Number(todayR.v),
    weekly: Number(weeklyR.v),
    monthly: Number(monthlyR.v),
  };

  // type 파라미터: total(기본), today, weekly, monthly
  const VALID_BADGE_TYPES = ["total", "today", "weekly", "monthly"] as const;
  type BadgeType = typeof VALID_BADGE_TYPES[number];
  const rawType = urlObj.searchParams.get("type") ?? "total";
  const badgeType: BadgeType = (VALID_BADGE_TYPES as readonly string[]).includes(rawType)
    ? rawType as BadgeType
    : "total";
  const displayCount = counts[badgeType] ?? counts.total;

  // 라벨 자동 설정
  const typeLabels: Record<string, string> = {
    total: urlObj.searchParams.get("label") || site.badgeLabel || "m1k",
    today: urlObj.searchParams.get("label") || "today",
    weekly: urlObj.searchParams.get("label") || "weekly",
    monthly: urlObj.searchParams.get("label") || "monthly",
  };

  // 1000 최초 돌파 기록
  if (counts.total >= 1000 && !site.reached1000At) {
    await db.update(sites).set({ reached1000At: new Date() }).where(eq(sites.id, site.id));
  }

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
