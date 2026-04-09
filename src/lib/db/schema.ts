import { pgTable, serial, text, integer, date, timestamp, uniqueIndex, boolean } from "drizzle-orm/pg-core";

export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id"),
  path: text("path"),
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
  verified: boolean("verified").default(false).notNull(),
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

// 포인트 지갑
export const points = pgTable("points", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  balance: integer("balance").default(0).notNull(),
  bonusClaimed: boolean("bonus_claimed").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// 포인트 사용 내역
export const pointLogs = pgTable("point_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  amount: integer("amount").notNull(), // +100 지급, -500 투입
  type: text("type").notNull(), // "bonus" | "purchase" | "inject"
  targetSiteId: integer("target_site_id"),
  memo: text("memo"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
