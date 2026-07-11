import { fetchRecentSites } from "@/lib/site-service";
import { handler, ok } from "@m1kapp/kit/server";

export const GET = handler(async (req) => {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const sort = (url.searchParams.get("sort") || "total") as "total" | "today";

  const enriched = await fetchRecentSites({ q, sort });
  return ok(enriched);
});
