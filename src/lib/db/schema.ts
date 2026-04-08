import { pgTable, serial, text, integer, date, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  slug: text("slug").notNull().unique(),
  title: text("title"),
  url: text("url"),
  color: text("color").default("#ec4899"),
  badgeStyle: text("badge_style").default("flat"),
  badgeLabel: text("badge_label").default("m1k"),
  badgeEmoji: text("badge_emoji"),
  ogTitle: text("og_title"),
  ogDescription: text("og_description"),
  ogImage: text("og_image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const hits = pgTable(
  "hits",
  {
    id: serial("id").primaryKey(),
    siteId: integer("site_id")
      .notNull()
      .references(() => sites.id),
    date: date("date").notNull(),
    count: integer("count").default(0).notNull(),
  },
  (table) => [uniqueIndex("idx_hits_site_date").on(table.siteId, table.date)]
);

export const hitLogs = pgTable("hit_logs", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id")
    .notNull()
    .references(() => sites.id),
  ipHash: text("ip_hash").notNull(),
  country: text("country"),
  city: text("city"),
  device: text("device"),
  browser: text("browser"),
  os: text("os"),
  referer: text("referer"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
