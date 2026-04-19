import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { scrapeOg } from "@/lib/og";
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
  const og = await scrapeOg(rawUrl);

  if (og.title || og.image) {
    await db
      .update(sites)
      .set({
        title: og.title || site!.title,
        ogTitle: og.title,
        ogDescription: og.description,
        ogImage: og.image,
      })
      .where(eq(sites.id, site!.id));
  }

  return ok({ ok: true, og });
});
