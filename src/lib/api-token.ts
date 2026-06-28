import { db } from "@/lib/db";
import { apiTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";

const PREFIX = "m1k_live_";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** 새 평문 토큰 생성 (저장은 호출부에서) */
function generateToken(): string {
  return PREFIX + randomBytes(24).toString("base64url");
}

/**
 * 사용자에게 토큰을 발급/재발급한다. 평문은 여기서만 반환되고 이후 다시 볼 수 없다.
 * 1인 1토큰 — 이미 있으면 교체(rotate).
 */
export async function issueToken(userId: string): Promise<string> {
  const token = generateToken();
  const tokenHash = hashToken(token);
  await db
    .insert(apiTokens)
    .values({ userId, tokenHash })
    .onConflictDoUpdate({
      target: apiTokens.userId,
      set: { tokenHash, createdAt: new Date(), lastUsedAt: null },
    });
  return token;
}

/** 사용자가 토큰을 발급한 적 있는지 (평문은 노출 안 함) */
export async function hasToken(userId: string): Promise<boolean> {
  const row = await db.query.apiTokens.findFirst({ where: eq(apiTokens.userId, userId) });
  return !!row;
}

/**
 * Authorization: Bearer <token> 헤더를 검증해 userId를 돌려준다.
 * 유효하지 않으면 null. 검증 성공 시 lastUsedAt 갱신(fire-and-forget).
 */
export async function userIdFromBearer(req: Request): Promise<string | null> {
  const header = req.headers.get("authorization") || "";
  const m = header.match(/^Bearer\s+(.+)$/i);
  const token = m?.[1]?.trim();
  if (!token || !token.startsWith(PREFIX)) return null;

  const row = await db.query.apiTokens.findFirst({
    where: eq(apiTokens.tokenHash, hashToken(token)),
  });
  if (!row) return null;

  db.update(apiTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiTokens.userId, row.userId))
    .catch(() => {});

  return row.userId;
}
