import type { Bucket, SiteQuality } from "@/lib/kit-stats-types";

export type Sort = "total" | "today" | "recent";

export const SORTS: { value: Sort; label: string }[] = [
  { value: "total", label: "인기" },
  { value: "today", label: "오늘" },
  { value: "recent", label: "신규" },
];

export interface SiteKitStats {
  kitVersion: string;
  files: number | null;
  codeLines: number | null;
  breakdown: { frontend: Bucket; backend: Bucket; shared: Bucket } | null;
  savedPercent: number | null;
  quality: SiteQuality | null;
}

export interface KitStatsPayload {
  latestKitVersion: string | null;
  stats: Record<string, SiteKitStats>;
}
