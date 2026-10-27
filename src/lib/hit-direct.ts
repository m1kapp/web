import { flushEntries } from "./flush-hits";
import { db } from "@/lib/db";
import { hits, sites } from "@/lib/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import { todayKST } from "@/lib/format";
import type { HitEntry, CountSnapshot } from "./hit-buffer";

// ─── Neon 직접 쓰기 (Redis 없을 때 폴백) ─────────────────────────────

export async function directWriteHit(entry: HitEntry): Promise<boolean> {
  return await flushEntries([entry]) > 0;
}

export async function directGetCountSnapshot(siteId: number): Promise<CountSnapshot | null> {
  const now = new Date();
  const todayStr = todayKST(now);
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30);

  const [siteRow, [todayR], [weeklyR], [monthlyR]] = await Promise.all([
    db.query.sites.findFirst({ where: eq(sites.id, siteId) }),
    db.select({ v: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, siteId), eq(hits.date, todayStr))),
    db.select({ v: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, siteId), gte(hits.date, todayKST(weekAgo)))),
    db.select({ v: sql<number>`coalesce(sum(${hits.count}), 0)` }).from(hits).where(and(eq(hits.siteId, siteId), gte(hits.date, todayKST(monthAgo)))),
  ]);

  if (!siteRow) return null;

  return {
    total: siteRow.totalHits,
    today: Number(todayR.v),
    weekly: Number(weeklyR.v),
    monthly: Number(monthlyR.v),
    updatedAt: new Date().toISOString(),
  };
}
