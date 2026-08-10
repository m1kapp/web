export interface RecentSite {
  slug: string;
  title: string | null;
  url: string | null;
  total: number;
  today?: number;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  faviconUrl?: string | null;
  color: string | null;
  owner: { name: string; imageUrl: string } | null;
  /** 등록 시각 — 최신 등록 섹션 정렬에 쓴다 */
  createdAt?: string;
}
