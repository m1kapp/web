import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hits, sites } from "@/lib/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import { readPendingHits, acknowledgeHits } from "@/lib/hit-buffer";
import { flushEntries } from "@/lib/flush-hits";
import { todayKST } from "@/lib/format";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const started = Date.now();
  let flushed = 0;
  const refreshed = new Set<number>();
  for (let round = 0; round < 20 && Date.now() - started < 45_000; round++) {
    const batch = await readPendingHits();
    if (batch.entries.length === 0) break;
    await flushEntries(batch.entries);
    const ids = [...new Set(batch.entries.map((e) => e.siteId))];
    const snapshots = await Promise.all(ids.map(refreshSnapshot));
    if (!await acknowledgeHits(batch, snapshots.filter((s) => s !== null))) break;
    flushed += batch.entries.length;
    ids.forEach((id) => refreshed.add(id));
  }
  return Response.json({ flushed, snapshots: refreshed.size });
}

/** 사이트 하나의 KV 카운트 스냅샷·milestone·site 캐시 갱신 */
async function refreshSnapshot(siteId: number) {
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

  const snapshot = {
    total: siteRow.totalHits,
    today: Number(todayR.v),
    weekly: Number(weeklyR.v),
    monthly: Number(monthlyR.v),
    updatedAt: new Date().toISOString(),
  };

  // milestone 체크
  if (siteRow.totalHits >= 1000 && !siteRow.reached1000At) {
    await db.update(sites).set({ reached1000At: new Date() }).where(eq(sites.id, siteId));
  }

  return { siteId, slug: siteRow.slug, site: siteRow, snapshot };
}
