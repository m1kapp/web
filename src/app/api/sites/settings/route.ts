import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSiteOwner, deleteSiteWithCascade } from "@/lib/site-service";
import { handler, ok, badRequest } from "@m1kapp/kit/server";

export const PUT = handler(async (req) => {
  const body = await req.json();
  const { slug, color, badgeStyle, badgeLabel, badgeEmoji } = body as {
    slug: string;
    color?: string;
    badgeStyle?: string;
    badgeLabel?: string;
    badgeEmoji?: string | null;
  };

  if (!slug) badRequest("slug 필요");

  const { site, error } = await requireSiteOwner(slug);
  if (error) return error;

  const updates: Record<string, string | null> = {};
  if (color) updates.color = color;
  if (badgeStyle) updates.badgeStyle = badgeStyle;
  if (badgeLabel) updates.badgeLabel = badgeLabel;
  if (badgeEmoji !== undefined) updates.badgeEmoji = badgeEmoji;

  if (Object.keys(updates).length === 0) {
    return ok({ ok: true });
  }

  await db.update(sites).set(updates).where(eq(sites.id, site.id));
  return ok({ ok: true });
});

export const DELETE = handler(async (req) => {
  const { slug } = (await req.json()) as { slug?: string };

  if (!slug) badRequest("slug 필요");

  const { site, error } = await requireSiteOwner(slug!);
  if (error) return error;

  await deleteSiteWithCascade(site.id);
  return ok({ ok: true });
});
