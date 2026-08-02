import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { scrapeOg } from "@/lib/og";
import { resolveFavicon, extractDominantColor } from "@/lib/favicon";
import { idToSlug, appHost } from "@/lib/utils";
import dns from "dns/promises";
import { randomBytes, timingSafeEqual } from "crypto";
import { handler, ok, badRequest, conflict, notFound, forbidden } from "@m1kapp/kit/server";
import { userIdFromBearer } from "@/lib/api-token";
import { getUserById } from "@/lib/user-handle";
import { deleteSiteWithCascade } from "@/lib/site-service";
import { purgeSiteBuffers } from "@/lib/hit-buffer";

/**
 * 사이트 등록 — CLI/AI(클로드)/사이드프로젝트용.
 *   POST /api/sites/cli  { url }
 *   (선택) Authorization: Bearer <개인 토큰>
 *
 * 토큰을 주면 → 바로 내 계정 소유로 등록(귀속 불필요).
 * 토큰이 없으면 → 익명 등록 + claimToken 발급(나중에 /claim 으로 귀속).
 * 어느 경우든 응답의 `snippet`을 사이트에 붙이면 추적이 시작된다.
 */
export const POST = handler(async (req) => {
  const tokenUserId = await userIdFromBearer(req);

  const body = await req.json().catch(() => ({}));
  const { url } = body as { url?: string };
  const rawUrl = url?.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!rawUrl) badRequest("URL을 입력해주세요");

  const fullUrl = `https://${rawUrl}`;
  const host = appHost();

  // 등록 결과를 공통 포맷으로 — snippet은 항상 포함
  const respond = (slug: string) => {
    const badgeUrl = `https://${host}/badge/${slug}.svg`;
    const siteUrl = `https://${host}/${slug}`;
    return {
      slug,
      url: fullUrl,
      badgeUrl,
      dashboardUrl: siteUrl,
      snippet: `<a href="${siteUrl}"><img src="${badgeUrl}" alt="hits" /></a>`,
    };
  };

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
    return respondForExisting(existing, tokenUserId, respond);
  }

  // 신규 등록 (+ OG/favicon 수집)
  const { slug, claimToken } = await createSite(rawUrl!, fullUrl, tokenUserId);

  // 토큰 등록 → 바로 내 소유, claim 안내 불필요
  if (tokenUserId) {
    return ok({ ...respond(slug), owned: true }, 201);
  }

  // 익명 등록 → claim 토큰/링크 함께 반환
  return ok(
    {
      ...respond(slug),
      claimToken,
      claimUrl: `https://${host}/claim?token=${claimToken}`,
    },
    201,
  );
});

/**
 * 사이트 등록 취소 — CLI용.
 *   DELETE /api/sites/cli  { slug }            + Authorization: Bearer <개인 토큰>
 *   DELETE /api/sites/cli  { slug, claimToken }
 *
 * 대시보드 삭제(`DELETE /api/sites/settings`)는 Clerk 브라우저 세션이 필요해서
 * CLI에서 쓸 수 없다. 특히 CLI로 익명 등록한 사이트는 아직 어느 계정에도 안
 * 붙어 있어서, 잘못 등록해도 지울 방법이 claim 토큰밖에 없었다. 그 구멍을 막는다.
 *
 * 권한 규칙:
 * - 귀속된 사이트 → Bearer 토큰의 소유자만
 * - 미귀속(익명) 사이트 → 발급받은 claimToken을 아는 사람만
 */
export const DELETE = handler(async (req) => {
  const body = await req.json().catch(() => ({}));
  const { slug, claimToken } = body as { slug?: string; claimToken?: string };
  if (!slug?.trim()) badRequest("slug를 입력해주세요");

  const site = await db.query.sites.findFirst({ where: eq(sites.slug, slug.trim()) });
  if (!site) notFound("그런 사이트가 없어요");

  // 자식 사이트(서브 경로)가 달려 있으면 조용히 고아로 만들지 않고 막는다.
  const child = await db.query.sites.findFirst({ where: eq(sites.parentId, site.id) });
  if (child) conflict("하위 사이트가 남아 있어요. 그것부터 지워주세요");

  if (site.userId) {
    const tokenUserId = await userIdFromBearer(req);
    if (!tokenUserId || tokenUserId !== site.userId) {
      forbidden("귀속된 사이트예요. 소유자 토큰(Authorization: Bearer)이 필요해요");
    }
  } else {
    if (!claimToken || !site.claimToken || !safeEqual(claimToken, site.claimToken)) {
      forbidden("claim 토큰이 필요해요 (.m1k.json 의 claimToken)");
    }
  }

  await deleteSiteWithCascade(site.id);
  await purgeSiteBuffers(site.id, site.slug);

  return ok({ ok: true, slug: site.slug, url: site.url });
});

/** 길이까지 비밀로 취급하는 상수시간 비교 — 토큰 비교에 == 를 쓰지 않는다. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

type Existing = NonNullable<Awaited<ReturnType<typeof db.query.sites.findFirst>>>;

/** 이미 등록된 URL — 소유 상태·토큰 유무에 따라 분기 */
async function respondForExisting(
  existing: Existing,
  tokenUserId: string | null,
  respond: (slug: string) => Record<string, string>,
) {
  // 내 토큰으로 이미 내 사이트면 → 그대로 snippet 다시 안내
  if (tokenUserId && existing.userId === tokenUserId) {
    return ok({ ...respond(existing.slug), alreadyOwned: true }, 200);
  }
  // 익명 등록 상태인데 내 토큰이 있으면 → 토큰 소유자로 바로 귀속
  if (tokenUserId && !existing.userId) {
    const owner = await getUserById(tokenUserId);
    const [claimed] = await db
      .update(sites)
      .set({
        userId: tokenUserId,
        claimToken: null,
        claimedAt: new Date(),
        ownerHandle: owner?.handle ?? null,
        ownerName: owner?.name ?? null,
        ownerImageUrl: owner?.imageUrl ?? null,
      })
      .where(eq(sites.id, existing.id))
      .returning();
    return ok({ ...respond(claimed.slug), claimed: true }, 200);
  }
  // 누군가 이미 귀속함
  if (existing.userId) conflict("이미 등록·귀속된 사이트예요. 로그인 후 확인하세요");
  // 익명 상태 + 토큰 없음 → 토큰 재발급 안 함(보안). 최초 claim 토큰으로 귀속해야 함.
  return ok(
    {
      ...respond(existing.slug),
      alreadyRegistered: true,
      message: "이미 등록된(미귀속) 사이트예요. 최초 발급된 claim 토큰으로 귀속하세요.",
    },
    200,
  );
}

/** 신규 사이트 insert (OG/favicon 수집 포함) — slug와 claimToken 반환 */
async function createSite(rawUrl: string, fullUrl: string, tokenUserId: string | null) {
  const [og, faviconUrl] = await Promise.all([scrapeOg(rawUrl), resolveFavicon(fullUrl)]);
  const autoColor = faviconUrl ? await extractDominantColor(faviconUrl) : null;

  // 토큰이 있으면 owner 정보까지 채워 바로 내 소유로
  const owner = tokenUserId ? await getUserById(tokenUserId) : null;
  const claimToken = tokenUserId ? null : randomBytes(24).toString("base64url");

  const [site] = await db
    .insert(sites)
    .values({
      slug: "tmp",
      userId: tokenUserId ?? null,
      createdVia: "cli",
      claimToken,
      claimedAt: tokenUserId ? new Date() : null,
      title: og.title || rawUrl,
      url: fullUrl,
      ogTitle: og.title,
      ogDescription: og.description,
      ogImage: og.image,
      faviconUrl: faviconUrl ?? null,
      color: autoColor,
      ownerHandle: owner?.handle ?? null,
      ownerName: owner?.name ?? null,
      ownerImageUrl: owner?.imageUrl ?? null,
    })
    .returning();

  const slug = idToSlug(site.id);
  await db.update(sites).set({ slug }).where(eq(sites.id, site.id));
  return { slug, claimToken };
}
