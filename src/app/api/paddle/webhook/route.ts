import { db } from "@/lib/db";
import { points, pointLogs } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { handler, ok } from "@m1kapp/kit/server";

// 부스트 상품 매핑 (Paddle Price ID → 부스트 수량)
// Paddle 대시보드에서 상품 만들고 여기에 매핑
const BOOST_PRODUCTS: Record<string, number> = {
  [process.env.PADDLE_PRICE_100 || "pri_100"]: 100,
  [process.env.PADDLE_PRICE_300 || "pri_300"]: 300,
  [process.env.PADDLE_PRICE_600 || "pri_600"]: 600,
  [process.env.PADDLE_PRICE_900 || "pri_900"]: 900,
};

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  // Paddle v2 서명: ts=xxx;h1=xxx
  const parts = signature.split(";").reduce<Record<string, string>>((acc, part) => {
    const [key, val] = part.split("=");
    acc[key] = val;
    return acc;
  }, {});

  const ts = parts["ts"];
  const h1 = parts["h1"];
  if (!ts || !h1) return false;

  const payload = `${ts}:${rawBody}`;
  const computed = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(h1));
}

export const POST = handler(async (req) => {
  const rawBody = await req.text();
  const signature = req.headers.get("paddle-signature");

  // 서명 검증 (production에서만 강제)
  if (process.env.NODE_ENV === "production" && !verifySignature(rawBody, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventType = payload.event_type;

  // 결제 완료 이벤트
  if (eventType === "transaction.completed") {
    const data = payload.data;
    const customData = data.custom_data as { userId?: string } | null;
    const userId = customData?.userId;

    if (!userId) {
      console.error("Paddle webhook: missing userId in custom_data");
      return ok({ ok: false, error: "missing userId" });
    }

    // 구매한 상품에서 부스트 수량 계산
    let totalBoost = 0;
    for (const item of data.items || []) {
      const priceId = item.price?.id;
      const qty = item.quantity || 1;
      const boostAmount = BOOST_PRODUCTS[priceId] || 0;
      totalBoost += boostAmount * qty;
    }

    if (totalBoost <= 0) {
      console.error("Paddle webhook: unknown price ID");
      return ok({ ok: false, error: "unknown product" });
    }

    // 지갑에 부스트 추가
    const existing = await db.query.points.findFirst({
      where: eq(points.userId, userId),
    });

    if (existing) {
      await db.update(points).set({
        balance: sql`${points.balance} + ${totalBoost}`,
      }).where(eq(points.userId, userId));
    } else {
      await db.insert(points).values({
        userId,
        balance: totalBoost + 100, // 가입 보너스 포함
        bonusClaimed: true,
      });
    }

    // 로그 기록
    await db.insert(pointLogs).values({
      userId,
      amount: totalBoost,
      type: "purchase",
      memo: `🚀 ${totalBoost.toLocaleString()} 부스트 구매 (Paddle: ${data.id})`,
    });

    return ok({ ok: true, boosted: totalBoost });
  }

  // 다른 이벤트는 무시
  return ok({ ok: true });
});
