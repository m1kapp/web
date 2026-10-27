import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { HitEntry } from "@/lib/hit-buffer";

/** 재시도 때 이미 저장된 방문은 빼고, 새 방문의 모든 집계를 한 번에 반영한다. */
export async function flushEntries(entries: HitEntry[]) {
  const query = sql`
    WITH input AS MATERIALIZED (
      SELECT DISTINCT ON ("siteId", "ipHash") *
      FROM jsonb_to_recordset(${JSON.stringify(entries)}::jsonb) AS x(
        "siteId" integer, "ipHash" text, country text, city text, device text,
        browser text, os text, referer text, date date, "hourKST" integer
      )
    ), inserted AS (
      INSERT INTO hit_logs (site_id, ip_hash, country, city, device, browser, os, referer)
      SELECT "siteId", "ipHash", country, city, device, browser, os, referer FROM input i
      JOIN sites s ON s.id = i."siteId"
      WHERE NOT EXISTS (
        SELECT 1 FROM hit_logs l WHERE l.site_id = i."siteId" AND l.ip_hash = i."ipHash"
      )
      RETURNING site_id, ip_hash
    ), accepted AS MATERIALIZED (
      SELECT i.* FROM input i JOIN inserted l
        ON l.site_id = i."siteId" AND l.ip_hash = i."ipHash"
    ), days AS (
      INSERT INTO hits (site_id, date, count)
      SELECT "siteId", date, count(*)::integer FROM accepted GROUP BY "siteId", date
      ON CONFLICT (site_id, date) DO UPDATE SET count = hits.count + EXCLUDED.count
    ), totals AS (
      UPDATE sites SET total_hits = total_hits + a.n
      FROM (SELECT "siteId", count(*)::integer n FROM accepted GROUP BY "siteId") a
      WHERE sites.id = a."siteId"
    ), geo AS (
      INSERT INTO daily_geo_stats (site_id, date, country, city, count)
      SELECT "siteId", date, coalesce(country, ''), coalesce(city, ''), count(*)::integer
      FROM accepted GROUP BY "siteId", date, coalesce(country, ''), coalesce(city, '')
      ON CONFLICT (site_id, date, country, city)
      DO UPDATE SET count = daily_geo_stats.count + EXCLUDED.count
    ), devices AS (
      INSERT INTO daily_device_stats (site_id, date, device, browser, os, count)
      SELECT "siteId", date, device, browser, os, count(*)::integer
      FROM accepted GROUP BY "siteId", date, device, browser, os
      ON CONFLICT (site_id, date, device, browser, os)
      DO UPDATE SET count = daily_device_stats.count + EXCLUDED.count
    ), hours AS (
      INSERT INTO daily_hour_stats (site_id, date, hour, count)
      SELECT "siteId", date, "hourKST", count(*)::integer
      FROM accepted GROUP BY "siteId", date, "hourKST"
      ON CONFLICT (site_id, date, hour)
      DO UPDATE SET count = daily_hour_stats.count + EXCLUDED.count
    )
    SELECT count(*)::integer AS inserted FROM inserted
  `;
  // 잠금을 얻은 다음 문장에서 새 DB 스냅샷을 읽어 동시 크론도 중복 삽입하지 않는다.
  const results = await db.batch([
    db.execute(sql`SELECT pg_advisory_xact_lock(17879634)`),
    db.execute(query),
  ]);
  return Number(results[1].rows[0]?.inserted ?? 0);
}
