import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { ilike } from "drizzle-orm";
import { handler, ok } from "@m1kapp/kit/server";

export const revalidate = 0;

export const GET = handler(async () => {
  const site = await db.query.sites.findFirst({
    where: ilike(sites.url, "%m1k.app%"),
    columns: { slug: true },
  });
  return ok({ slug: site?.slug ?? null });
});
