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
}
