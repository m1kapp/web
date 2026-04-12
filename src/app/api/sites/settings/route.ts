import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSiteOwner, deleteSiteWithCascade } from "@/lib/site-service";

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { slug, color, badgeStyle, badgeLabel, badgeEmoji } = body as {
    slug: string;
    color?: string;
    badgeStyle?: string;
    badgeLabel?: string;
    badgeEmoji?: string | null;
  };

  if (!slug) {
    return NextResponse.json({ error: "slug 필요" }, { status: 400 });
  }

  const { site, error } = await requireSiteOwner(slug);
  if (error) return error;

  const updates: Record<string, string | null> = {};
  if (color) updates.color = color;
  if (badgeStyle) updates.badgeStyle = badgeStyle;
  if (badgeLabel) updates.badgeLabel = badgeLabel;
  if (badgeEmoji !== undefined) updates.badgeEmoji = badgeEmoji;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true });
  }

  await db.update(sites).set(updates).where(eq(sites.id, site.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { slug } = (await request.json()) as { slug?: string };

  if (!slug) {
    return NextResponse.json({ error: "slug 필요" }, { status: 400 });
  }

  const { site, error } = await requireSiteOwner(slug);
  if (error) return error;

  await deleteSiteWithCascade(site.id);
  return NextResponse.json({ ok: true });
}
