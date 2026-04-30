/**
 * 기존 사이트 전체의 favicon_url + color 백필
 * 실행: npx tsx scripts/backfill-favicon.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sites } from "../src/lib/db/schema";
import { isNotNull } from "drizzle-orm";
import { resolveFavicon, extractDominantColor } from "../src/lib/favicon";
import { eq } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema: { sites } });

async function main() {
  await sql`ALTER TABLE "sites" ADD COLUMN IF NOT EXISTS "favicon_url" text`;
  console.log("✓ favicon_url 컬럼 확인");

  const rows = await db.select({ id: sites.id, url: sites.url, color: sites.color })
    .from(sites)
    .where(isNotNull(sites.url));

  console.log(`총 ${rows.length}개 사이트 처리 시작\n`);

  let ok = 0, fail = 0;
  for (const row of rows) {
    const favicon = await resolveFavicon(row.url!);
    if (favicon) {
      const color = await extractDominantColor(favicon);
      const updates: Record<string, string> = { faviconUrl: favicon };
      if (color && !row.color) updates.color = color;

      await db.update(sites).set(updates).where(eq(sites.id, row.id));
      console.log(`✓ [${row.id}] ${row.url}`);
      console.log(`  favicon: ${favicon}`);
      if (color) console.log(`  color:   ${color}${row.color ? " (기존 유지)" : ""}`);
      ok++;
    } else {
      console.log(`✗ [${row.id}] ${row.url} → favicon 없음`);
      fail++;
    }
  }

  console.log(`\n완료: 성공 ${ok}개, 실패 ${fail}개`);
}

main();
