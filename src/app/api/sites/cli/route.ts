import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { scrapeOg } from "@/lib/og";
import { resolveFavicon, extractDominantColor } from "@/lib/favicon";
import { idToSlug, appHost } from "@/lib/utils";
import dns from "dns/promises";
import { randomBytes } from "crypto";
import { handler, ok, badRequest, conflict } from "@m1kapp/kit/server";

/**
 * 익명(무로그인) 사이트 등록 — CLI/사이드프로젝트용.
 *   POST /api/sites/cli  { url }
 * → { slug, badgeUrl, claimToken, claimUrl, snippet }
 *
 * 로그인 없이 slug를 발급받아 바로 배지를 심을 수 있고(수집은 원래 무인증),
 * claimToken으로 나중에 계정에 귀속(claim)한다. → /api/sites/claim
 */
export const POST = handler(async (req) => {
  const body = await req.json().catch(() => ({}));
  const { url } = body as { url?: string };
  const rawUrl = url?.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!rawUrl) badRequest("URL을 입력해주세요");

  const fullUrl = `https://${rawUrl}`;

  // 도메인 존재 확인 (DNS 조회) — 무인증이라 최소 방어
  const hostname = rawUrl!.split("/")[0];
  try {
    await dns.resolve(hostname);
  } catch {
    badRequest("존재하지 않는 도메인이에요");
  }

  // 이미 등록된 URL 처리
  const existing = await db.query.sites.findFirst({ where: eq(sites.url, fullUrl) });
  if (existing) {
    // 이미 누군가 계정에 귀속함 → 등록 불가 (로그인 후 본인 사이트에서 확인)
    if (existing.userId) conflict("이미 등록·귀속된 사이트예요. 로그인 후 확인하세요");
    // 미claim 상태로 이미 존재 → 토큰은 절대 재발급하지 않음(보안). 최초 토큰으로 claim해야 함.
    return ok(
      {
        slug: existing.slug,
        url: existing.url,
        badgeUrl: `https://${appHost()}/badge/${existing.slug}.svg`,
        alreadyRegistered: true,
        message: "이미 등록된(미귀속) 사이트예요. 최초 발급된 claim 토큰으로 귀속하세요.",
      },
      200,
    );
  }

  // 신규 익명 등록 (+ OG/favicon 수집, owner는 비움)
  const [og, faviconUrl] = await Promise.all([scrapeOg(rawUrl!), resolveFavicon(fullUrl)]);
  const autoColor = faviconUrl ? await extractDominantColor(faviconUrl) : null;
  const claimToken = randomBytes(24).toString("base64url");

  const [site] = await db
    .insert(sites)
    .values({
      slug: "tmp",
      userId: null,
      createdVia: "cli",
      claimToken,
      title: og.title || rawUrl!,
      url: fullUrl,
      ogTitle: og.title,
      ogDescription: og.description,
      ogImage: og.image,
      faviconUrl: faviconUrl ?? null,
      color: autoColor,
    })
    .returning();

  const slug = idToSlug(site.id);
  await db.update(sites).set({ slug }).where(eq(sites.id, site.id));

  const host = appHost();
  const badgeUrl = `https://${host}/badge/${slug}.svg`;
  const siteUrl = `https://${host}/${slug}`;

  return ok(
    {
      slug,
      url: fullUrl,
      badgeUrl,
      claimToken,
      claimUrl: `https://${host}/claim?token=${claimToken}`,
      // 바로 붙여넣을 수 있는 스니펫
      snippet: `<a href="${siteUrl}"><img src="${badgeUrl}" alt="hits" /></a>`,
    },
    201,
  );
});
