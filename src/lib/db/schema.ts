import { pgTable, serial, text, integer, date, timestamp, uniqueIndex, index, boolean } from "drizzle-orm/pg-core";

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
  ownerHandle: text("owner_handle"),
  ownerName: text("owner_name"),
  ownerImageUrl: text("owner_image_url"),
  totalHits: integer("total_hits").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  reached1000At: timestamp("reached_1000_at", { withTimezone: true }),
}, (table) => [
  index("idx_sites_user_id").on(table.userId),
]);

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
}, (table) => [
  index("idx_hit_logs_site_id").on(table.siteId),
]);

// ─── 사전집계 통계 테이블 ──────────────────────────────────────────────────────
// hitLogs 전체 스캔 대신 hit 기록 시 함께 업데이트 → analytics 쿼리 O(1)

export const dailyGeoStats = pgTable("daily_geo_stats", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull().references(() => sites.id),
  date: date("date").notNull(),
  country: text("country").notNull().default(""),
  city: text("city").notNull().default(""),
  count: integer("count").default(1).notNull(),
}, (table) => [
  uniqueIndex("idx_daily_geo_stats_unique").on(table.siteId, table.date, table.country, table.city),
  index("idx_daily_geo_stats_site").on(table.siteId),
]);

export const dailyDeviceStats = pgTable("daily_device_stats", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull().references(() => sites.id),
  date: date("date").notNull(),
  device: text("device").notNull().default(""),
  browser: text("browser").notNull().default(""),
  os: text("os").notNull().default(""),
  count: integer("count").default(1).notNull(),
}, (table) => [
  uniqueIndex("idx_daily_device_stats_unique").on(table.siteId, table.date, table.device, table.browser, table.os),
  index("idx_daily_device_stats_site").on(table.siteId),
]);

export const dailyHourStats = pgTable("daily_hour_stats", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull().references(() => sites.id),
  date: date("date").notNull(),
  hour: integer("hour").notNull(),
  count: integer("count").default(1).notNull(),
}, (table) => [
  uniqueIndex("idx_daily_hour_stats_unique").on(table.siteId, table.date, table.hour),
  index("idx_daily_hour_stats_site").on(table.siteId),
]);

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
}, (table) => [
  index("idx_point_logs_user_id").on(table.userId),
  index("idx_point_logs_target_site_id").on(table.targetSiteId),
]);
