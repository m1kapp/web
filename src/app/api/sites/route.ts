import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { scrapeOg } from "@/lib/og";
import { auth } from "@clerk/nextjs/server";
import { idToSlug } from "@/lib/utils";
import dns from "dns/promises";
import { handler, ok, unauthorized, badRequest, conflict } from "@m1kapp/kit/server";
import { getUserById } from "@/lib/user-handle";

export const POST = handler(async (req) => {
  const { userId } = await auth();
  if (!userId) unauthorized("로그인이 필요합니다");

  const body = await req.json();
  const { url } = body as { url?: string };
  const rawUrl = url?.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  if (!rawUrl) badRequest("URL을 입력해주세요");

  const fullUrl = `https://${rawUrl}`;

  // 도메인 존재 확인 (DNS 조회)
  const hostname = rawUrl!.split("/")[0];
  try {
    await dns.resolve(hostname);
  } catch {
    badRequest("존재하지 않는 도메인이에요");
  }

  // 이미 등록된 사이트 (URL 기준)
  const existing = await db.query.sites.findFirst({
    where: eq(sites.url, fullUrl),
  });

  if (existing) {
    if (existing.userId !== userId) conflict("이미 다른 사용자가 등록한 사이트예요");
    return ok(existing);
  }

  // 신규 등록 + OG 수집
  const [og, owner] = await Promise.all([
    scrapeOg(rawUrl!),
    getUserById(userId!),
  ]);

  const [site] = await db
    .insert(sites)
    .values({
      slug: "tmp",
      userId: userId!,
      title: og.title || rawUrl!,
      url: fullUrl,
      ogTitle: og.title,
      ogDescription: og.description,
      ogImage: og.image,
      ownerHandle: owner?.handle ?? null,
      ownerName: owner?.name ?? null,
      ownerImageUrl: owner?.imageUrl ?? null,
    })
    .returning();

  // id 기반 base62 slug 부여
  const slug = idToSlug(site.id);
  await db.update(sites).set({ slug }).where(eq(sites.id, site.id));

  return ok({ ...site, slug });
});
