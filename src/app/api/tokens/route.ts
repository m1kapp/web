import { auth } from "@clerk/nextjs/server";
import { handler, ok, unauthorized } from "@m1kapp/kit/server";
import { issueToken, hasToken } from "@/lib/api-token";

/**
 * 개인 API 토큰 — CLI/AI(클로드)가 내 계정으로 사이트를 바로 등록할 때 쓴다.
 *   GET  /api/tokens  → { exists }            (평문은 절대 반환 안 함)
 *   POST /api/tokens  → { token }             (발급/재발급, 평문은 이때 1회만)
 */
export const GET = handler(async () => {
  const { userId } = await auth();
  if (!userId) unauthorized("로그인이 필요합니다");
  return ok({ exists: await hasToken(userId) });
});

export const POST = handler(async () => {
  const { userId } = await auth();
  if (!userId) unauthorized("로그인이 필요합니다");
  const token = await issueToken(userId);
  return ok({ token });
});
