import { fetchRecentSites } from "@/lib/site-service";
import { handler } from "@m1kapp/kit/server";

export const GET = handler(async (req) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const sort = (url.searchParams.get("sort") || "total") as "total" | "today" | "recent";

  const enriched = await fetchRecentSites({ q, sort });
  // 사용자별 값이 없는 공개 목록 — CDN이 받게 해서 방문마다 DB를 치지 않는다
  return Response.json(enriched, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" },
  });
});
