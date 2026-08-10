import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { scrapeOg } from "@/lib/og";
import { resolveFavicon, extractDominantColor } from "@/lib/favicon";

type SiteRow = typeof sites.$inferSelect;

export type RefreshResult = {
  slug: string;
  updated: string[];
  error?: string;
};

/**
 * 사이트의 OG·파비콘·대표색을 다시 긁어 저장한다.
 *
 * 남의 서버를 긁는 작업이라 실패가 정상 범주다(도메인 만료, 봇 차단, 타임아웃).
 * 그래서 던지지 않고 결과에 error를 담아 돌려준다 — 한 사이트 때문에 일괄 갱신이 멈추면 안 된다.
 *
 * 색은 이미 정해둔 사이트를 덮지 않는다. 소유자가 고른 값일 수 있다.
 */
export async function refreshSiteMeta(site: SiteRow): Promise<RefreshResult> {
  const rawUrl = (site.url || site.slug).replace(/^https?:\/\//, "");
  const fullUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

  try {
    const [og, faviconUrl] = await Promise.all([scrapeOg(rawUrl), resolveFavicon(fullUrl)]);
    const autoColor = faviconUrl ? await extractDominantColor(faviconUrl) : null;

    const updates: Record<string, string | null> = {};
    if (og.title) {
      updates.title = og.title;
      updates.ogTitle = og.title;
    }
    if (og.description) updates.ogDescription = og.description;
    if (og.image) updates.ogImage = og.image;
    if (faviconUrl) updates.faviconUrl = faviconUrl;
    if (autoColor && !site.color) updates.color = autoColor;

    if (Object.keys(updates).length > 0) {
      await db.update(sites).set(updates).where(eq(sites.id, site.id));
    }

    return { slug: site.slug, updated: Object.keys(updates) };
  } catch (err) {
    return { slug: site.slug, updated: [], error: err instanceof Error ? err.message : String(err) };
  }
}

/** 남의 서버를 긁는 일이라 한 번에 몰아치지 않는다 */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await fn(items[index]);
      }
    }),
  );
  return results;
}
