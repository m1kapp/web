export function countryFlag(code: string | null): string {
  if (!code || code.length !== 2) return "🌍";
  return String.fromCodePoint(
    ...code.toUpperCase().split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

export function deviceIcon(device: string | null): string {
  if (device === "mobile") return "📱";
  if (device === "tablet") return "📟";
  return "🖥️";
}

export function extractDomain(url: string | null): string {
  if (!url) return "직접 접속";
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
