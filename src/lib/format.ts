/** 숫자를 간결하게 표시 (1234 → "1.2k") */
export function compactNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k`;
  return String(n);
}

export { todayKST } from "@m1kapp/kit/server";

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

export function browserIcon(browser: string | null): string {
  if (!browser) return "🌐";
  const b = browser.toLowerCase();
  if (b.includes("chrome")) return "🟡";
  if (b.includes("safari")) return "🔵";
  if (b.includes("firefox")) return "🦊";
  if (b.includes("edge")) return "🌀";
  if (b.includes("samsung")) return "📱";
  return "🌐";
}

export function osIcon(os: string | null): string {
  if (!os) return "💻";
  const o = os.toLowerCase();
  if (o.includes("ios") || o.includes("iphone") || o.includes("ipad")) return "🍎";
  if (o.includes("mac")) return "🍎";
  if (o.includes("android")) return "🤖";
  if (o.includes("windows")) return "🪟";
  if (o.includes("linux")) return "🐧";
  return "💻";
}

export function formatLogDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit",
  });
}

export function formatHour(hour: number): string {
  if (hour === 0) return "자정";
  if (hour < 12) return `오전 ${hour}시`;
  if (hour === 12) return "정오";
  return `오후 ${hour - 12}시`;
}
