import { NextRequest, NextResponse } from "next/server";
import { fetchRecentSites } from "@/lib/site-service";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || "";
  const sort = (url.searchParams.get("sort") || "total") as "total" | "today" | "boosted";

  const enriched = await fetchRecentSites({ q, sort });
  return NextResponse.json(enriched);
}
