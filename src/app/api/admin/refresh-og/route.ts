import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { handler, ok, unauthorized } from "@m1kapp/kit/server";
import { mapLimit, refreshSiteMeta } from "@/lib/refresh-site-meta";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * 등록된 모든 사이트의 메타(OG·파비콘·대표색)를 다시 긁는다.
 *
 *   GET /api/admin/refresh-og?secret=...            전체
 *   GET /api/admin/refresh-og?secret=...&limit=20   앞에서 20개만
 *   GET /api/admin/refresh-og?secret=...&slug=gG    한 사이트만
 *
 * 사이트별 refresh-og는 소유자 본인만 쓸 수 있어서, 남이 등록해두고 방치한 사이트는
 * 제목이 URL 그대로 남는다. 그걸 한 번에 훑는 용도다.
 *
 * 외부 서버를 긁으므로 실패는 정상 범주로 보고 건너뛴다. 응답에 실패 목록이 남는다.
 */
export const GET = handler(async (req) => {
  const params = new URL(req.url).searchParams;
  if (params.get("secret") !== process.env.ADMIN_SECRET) unauthorized("invalid secret");

  const slug = params.get("slug");
  const limit = Number(params.get("limit") ?? 0);

  const all = await db.select().from(sites);
  const targets = (slug ? all.filter((s) => s.slug === slug) : all).slice(0, limit > 0 ? limit : undefined);

  // maxDuration 60초 안에 끝내야 해서 동시 4개까지만 — 더 늘리면 상대 서버에도 부담이다
  const results = await mapLimit(targets, 4, refreshSiteMeta);

  const failed = results.filter((r) => r.error);
  const changed = results.filter((r) => !r.error && r.updated.length > 0);

  return ok({
    total: targets.length,
    changed: changed.length,
    unchanged: results.length - changed.length - failed.length,
    failed: failed.length,
    details: { changed, failed },
  });
});
