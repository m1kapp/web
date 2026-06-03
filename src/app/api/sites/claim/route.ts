import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { handler, ok, unauthorized, badRequest, conflict } from "@m1kapp/kit/server";
import { getUserById } from "@/lib/user-handle";

/**
 * 익명 등록 사이트를 내 계정에 귀속(claim).
 *   POST /api/sites/claim  { claimToken }
 *
 * claimToken은 /api/sites/cli 등록 시 1회 발급된 비밀키.
 * 토큰이 맞고 아직 미귀속(userId=null)이면 현재 로그인 사용자로 소유권 이전.
 */
export const POST = handler(async (req) => {
  const { userId } = await auth();
  if (!userId) unauthorized("로그인이 필요합니다");

  const body = await req.json().catch(() => ({}));
  const { claimToken } = body as { claimToken?: string };
  const token = claimToken?.trim();
  if (!token) badRequest("claim 토큰이 필요합니다");

  const site = await db.query.sites.findFirst({ where: eq(sites.claimToken, token) });
  // 토큰 자체를 못 찾음 → 이미 귀속돼 토큰이 폐기됐거나 오타. 모호하게 처리(토큰 존재 여부 노출 최소화)
  if (!site) badRequest("유효하지 않거나 이미 사용된 토큰이에요");

  if (site!.userId) {
    // 토큰은 claim 시 null로 지우므로 여기 거의 안 오지만 방어적으로.
    conflict("이미 귀속된 사이트예요");
  }

  const owner = await getUserById(userId!);
  const [claimed] = await db
    .update(sites)
    .set({
      userId: userId!,
      claimToken: null, // 1회용 — 귀속과 동시에 폐기
      claimedAt: new Date(),
      ownerHandle: owner?.handle ?? null,
      ownerName: owner?.name ?? null,
      ownerImageUrl: owner?.imageUrl ?? null,
    })
    .where(eq(sites.id, site!.id))
    .returning();

  return ok({ slug: claimed.slug, url: claimed.url, title: claimed.title });
});
