import { sites, hits } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

// sites × hits 집계 쿼리들이 공유하는 조각.
// getUserSites(page)와 builders 라우트가 같은 컬럼·합계식을 복붙하던 것을 단일화.

// 방문자 총합 — leftJoin(hits) 후 groupBy(sites.id) 기준
export const totalHitsSql = sql<number>`coalesce(sum(${hits.count}), 0)`;

// 사이트 카드 공통 컬럼 (slug·제목·색·og·파비콘·url)
export const siteCardColumns = {
  slug: sites.slug,
  title: sites.title,
  ogTitle: sites.ogTitle,
  faviconUrl: sites.faviconUrl,
  color: sites.color,
  url: sites.url,
};
