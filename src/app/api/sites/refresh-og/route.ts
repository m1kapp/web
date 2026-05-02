import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { scrapeOg } from "@/lib/og";
import { resolveFavicon, extractDominantColor } from "@/lib/favicon";
import { auth } from "@clerk/nextjs/server";
import { handler, ok, unauthorized, notFound, forbidden } from "@m1kapp/kit/server";

export const POST = handler(async (req) => {
  const { userId } = await auth();
  if (!userId) unauthorized("로그인이 필요합니다");

  const { slug } = (await req.json()) as { slug: string };

  const site = await db.query.sites.findFirst({
    where: eq(sites.slug, slug),
  });

  if (!site) notFound("사이트 없음");
  if (site!.userId !== userId) forbidden("권한이 없습니다");

  const rawUrl = (site!.url || slug).replace(/^https?:\/\//, "");
  const fullUrl = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

  const [og, faviconUrl] = await Promise.all([
    scrapeOg(rawUrl),
    resolveFavicon(fullUrl),
  ]);

  const autoColor = faviconUrl ? await extractDominantColor(faviconUrl) : null;

  const updates: Record<string, string | null> = {};
  if (og.title) { updates.title = og.title; updates.ogTitle = og.title; }
  if (og.description) updates.ogDescription = og.description;
  if (og.image) updates.ogImage = og.image;
  if (faviconUrl) updates.faviconUrl = faviconUrl;
  if (autoColor && !site!.color) updates.color = autoColor;

  if (Object.keys(updates).length > 0) {
    await db.update(sites).set(updates).where(eq(sites.id, site!.id));
  }

  return ok({ ok: true, og, faviconUrl });
});
