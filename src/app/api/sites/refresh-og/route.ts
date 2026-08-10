import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { handler, ok, unauthorized, notFound, forbidden } from "@m1kapp/kit/server";
import { refreshSiteMeta } from "@/lib/refresh-site-meta";

/** 내 사이트 하나의 메타를 다시 긁는다. 전체 일괄은 /api/admin/refresh-og. */
export const POST = handler(async (req) => {
  const { userId } = await auth();
  if (!userId) unauthorized("로그인이 필요합니다");

  const { slug } = (await req.json()) as { slug: string };

  const site = await db.query.sites.findFirst({ where: eq(sites.slug, slug) });
  if (!site) notFound("사이트 없음");
  if (site!.userId !== userId) forbidden("권한이 없습니다");

  const result = await refreshSiteMeta(site!);
  return ok(result);
});
