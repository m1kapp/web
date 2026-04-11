import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { ilike } from "drizzle-orm";

export const revalidate = 0;

export async function GET() {
  const site = await db.query.sites.findFirst({
    where: ilike(sites.url, "%m1k.app%"),
    columns: { slug: true },
  });
  return NextResponse.json({ slug: site?.slug ?? null });
}
