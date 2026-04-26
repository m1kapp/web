import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { isNull, isNotNull, and, eq } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { resolveHandle } from "@/lib/user-handle";
import { handler, ok, unauthorized } from "@m1kapp/kit/server";

export const GET = handler(async (req) => {
  const secret = new URL(req.url).searchParams.get("secret");
  if (secret !== process.env.ADMIN_SECRET) unauthorized("invalid secret");

  // ownerHandle이 없고 userId는 있는 사이트들
  const targets = await db
    .select({ id: sites.id, userId: sites.userId })
    .from(sites)
    .where(and(isNotNull(sites.userId), isNull(sites.ownerHandle)));

  if (targets.length === 0) return ok({ updated: 0, message: "이미 모두 백필됨" });

  // userId 중복 제거 후 Clerk 일괄 조회
  const uniqueUserIds = [...new Set(targets.map((s) => s.userId!))]
  const clerk = await clerkClient();
  const { data: users } = await clerk.users.getUserList({ userId: uniqueUserIds, limit: uniqueUserIds.length });

  const userMap = new Map(
    users.map((u) => [
      u.id,
      {
        handle: resolveHandle(u),
        name: u.firstName || resolveHandle(u),
        imageUrl: u.imageUrl,
      },
    ])
  );

  // 사이트별 업데이트
  let updated = 0;
  await Promise.all(
    targets.map(async (site) => {
      const info = userMap.get(site.userId!);
      if (!info?.handle) return;
      await db
        .update(sites)
        .set({ ownerHandle: info.handle, ownerName: info.name, ownerImageUrl: info.imageUrl })
        .where(eq(sites.id, site.id));
      updated++;
    })
  );

  return ok({ updated, total: targets.length });
});
