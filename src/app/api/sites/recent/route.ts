import { fetchRecentSites } from "@/lib/site-service";
import { handler } from "@m1kapp/kit/server";

export const GET = handler(async (req) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const sort = (url.searchParams.get("sort") || "total") as "total" | "today" | "recent";

  // 인기 차트에서 지난 날짜로 넘겨 볼 때 — 형식이 아니면 무시하고 오늘
  const date = url.searchParams.get("date") ?? "";
  const enriched = await fetchRecentSites({ q, sort, date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined });
  // 사용자별 값이 없는 공개 목록 — CDN이 받게 해서 방문마다 DB를 치지 않는다
  return Response.json(enriched, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" },
  });
});
