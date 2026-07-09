export type BadgeStyle = "flat" | "flat-square" | "rounded" | "cyworld";
export type SnippetFormat = "markdown" | "html";

export const STYLES: { id: BadgeStyle; label: string }[] = [
  { id: "cyworld", label: "Cyworld" },
  { id: "flat", label: "Flat" },
  { id: "flat-square", label: "Square" },
  { id: "rounded", label: "Rounded" },
];

export const COLORS = [
  { value: "000000", label: "Black" },
  { value: "ec4899", label: "Pink" },
  { value: "8b5cf6", label: "Purple" },
  { value: "3b82f6", label: "Blue" },
  { value: "10b981", label: "Green" },
  { value: "f97316", label: "Orange" },
  { value: "ef4444", label: "Red" },
  { value: "555555", label: "Gray" },
];

export function buildBadgeUrl(host: string, slug: string) {
  return `https://${host}/badge/${slug}.svg`;
}

export function buildPreviewUrl(slug: string, style: BadgeStyle, color: string) {
  return `/badge/${slug}.svg?style=${style}&color=${color}&view=true`;
}

export function buildSnippet(format: SnippetFormat, badgeUrl: string, dashboardUrl: string) {
  if (format === "html") {
    return `<a href="${dashboardUrl}">\n  <img\n    src="${badgeUrl}"\n    alt="Hits"\n  />\n</a>`;
  }
  return `[![Hits](${badgeUrl})](${dashboardUrl})`;
}
