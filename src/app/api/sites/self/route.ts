import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { handler, ok } from "@m1kapp/kit/server";

export const GET = handler(async () => {
  const self = await db.query.sites.findFirst({
    where: eq(sites.url, "https://m1k.app"),
    columns: { slug: true },
  });
  return ok({ slug: self?.slug ?? null });
});
