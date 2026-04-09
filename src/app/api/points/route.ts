import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { points, pointLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";

const SIGNUP_BONUS = 100;

// 잔액 조회 + 가입 보너스 자동 지급
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  let wallet = await db.query.points.findFirst({
    where: eq(points.userId, userId),
  });

  // 첫 조회 → 지갑 생성 + 보너스
  if (!wallet) {
    const [created] = await db
      .insert(points)
      .values({ userId, balance: SIGNUP_BONUS, bonusClaimed: true })
      .returning();

    await db.insert(pointLogs).values({
      userId,
      amount: SIGNUP_BONUS,
      type: "bonus",
      memo: "🚀 가입 부스트 지급",
    });

    wallet = created;
  }

  return NextResponse.json({ balance: wallet.balance });
}
