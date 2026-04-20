import { db } from "@/lib/db";
import { pointLogs, sites } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { clerkClient } from "@clerk/nextjs/server";
import { handler, ok, badRequest } from "@m1kapp/kit/server";

export const GET = handler(async (req) => {
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) badRequest("slug가 필요합니다");

  const site = await db.query.sites.findFirst({ where: eq(sites.slug, slug!) });
  if (!site) return ok([]);

  const logs = await db.query.pointLogs.findMany({
    where: and(eq(pointLogs.targetSiteId, site.id), eq(pointLogs.type, "inject")),
    orderBy: desc(pointLogs.createdAt),
    limit: 50,
  });

  if (logs.length === 0) return ok([]);

  const uniqueUserIds = [...new Set(logs.map((l) => l.userId))];
  const clerk = await clerkClient();
  const users = await clerk.users.getUserList({ userId: uniqueUserIds, limit: Math.min(uniqueUserIds.length, 100) });
  const userMap = Object.fromEntries(
    users.data.map((u) => [u.id, { name: u.firstName || u.username || "익명", imageUrl: u.imageUrl }])
  );

  return ok(
    logs.map((l) => ({
      amount: Math.abs(l.amount),
      createdAt: l.createdAt,
      memo: l.memo && !l.memo.startsWith("🚀") ? l.memo : null,
      user: userMap[l.userId] ?? { name: "익명", imageUrl: null },
    }))
  );
});
