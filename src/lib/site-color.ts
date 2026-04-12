const FALLBACK_COLORS = [
  "#ec4899", "#a855f7", "#3b82f6", "#22c55e", "#f97316", "#ef4444",
];

export function slugToColor(slug: string): string {
  let h = 0;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) | 0;
  return FALLBACK_COLORS[Math.abs(h) % FALLBACK_COLORS.length];
}
