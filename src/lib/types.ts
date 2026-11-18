export interface RecentSite {
  slug: string;
  title: string | null;
  url: string | null;
  total: number;
  today?: number;
  /** 어제(KST) 방문 — 인기 차트에서 하루 전으로 넘겨 볼 때 */
  yesterday?: number;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  faviconUrl?: string | null;
  color: string | null;
  /** 소유자 — 귀속된 사이트만 값이 있다 */
  userId?: string | null;
  /** 등록 시각 — 최신 등록 섹션 정렬에 쓴다. 서버에선 Date, JSON을 거치면 string */
  createdAt?: string | Date | null;
}
