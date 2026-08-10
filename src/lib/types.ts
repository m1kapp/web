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
  /** 소유자 — 귀속된 사이트만 값이 있다. owner는 Clerk 조회에 실패하면 비므로 주인 판정은 이걸로 한다 */
  userId?: string | null;
  owner: { name: string; imageUrl: string } | null;
  /** 등록 시각 — 최신 등록 섹션 정렬에 쓴다. 서버에선 Date, JSON을 거치면 string */
  createdAt?: string | Date | null;
}
