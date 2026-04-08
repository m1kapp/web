export interface BadgeOptions {
  label?: string;
  color?: string;
  labelColor?: string;
  style?: "flat" | "flat-square" | "rounded" | "cyworld";
}

export function generateBadge(
  count: number,
  goal: number = 1000,
  options: BadgeOptions = {},
  todayCount: number = 0
): string {
  const style = options.style || "flat";
  if (style === "cyworld") return cyworldBadge(count, todayCount, options);
  return modernBadge(count, options);
}

// ── shields.io 정밀 텍스트 측정 (Verdana 11px 기준) ──
const CHAR_WIDTHS: Record<string, number> = {
  " ": 3.3, "!": 3.65, '"': 4.75, "#": 7.55, $: 6, "%": 8.55, "&": 7.25,
  "'": 2.55, "(": 3.65, ")": 3.65, "*": 5.55, "+": 7.55, ",": 3.3, "-": 4.4,
  ".": 3.3, "/": 4.6, "0": 6.5, "1": 6.5, "2": 6.5, "3": 6.5, "4": 6.5,
  "5": 6.5, "6": 6.5, "7": 6.5, "8": 6.5, "9": 6.5, ":": 3.3, ";": 3.65,
  "<": 7.55, "=": 7.55, ">": 7.55, "?": 5.55, "@": 10, A: 7.15, B: 6.85,
  C: 6.8, D: 7.55, E: 6.15, F: 5.75, G: 7.55, H: 7.55, I: 3.05, J: 4.35,
  K: 6.85, L: 5.75, M: 8.85, N: 7.55, O: 7.85, P: 6.2, Q: 7.85, R: 6.85,
  S: 6.5, T: 5.75, U: 7.55, V: 6.85, W: 10, X: 6.5, Y: 5.75, Z: 6.5,
  a: 5.85, b: 6.35, c: 5.15, d: 6.35, e: 5.85, f: 3.65, g: 6.35, h: 6.5,
  i: 2.75, j: 3.3, k: 6.15, l: 2.75, m: 9.75, n: 6.5, o: 6.2, p: 6.35,
  q: 6.35, r: 4.4, s: 5.15, t: 4.05, u: 6.5, v: 5.85, w: 8.55, x: 5.85,
  y: 5.85, z: 5.15,
};

function textWidth(text: string): number {
  let w = 0;
  for (const ch of text) w += CHAR_WIDTHS[ch] ?? 6.5;
  return w;
}

// ── 모던 배지 ──
function modernBadge(count: number, options: BadgeOptions): string {
  const { label = "m1k", color, labelColor = "#555", style = "flat" } = options;
  const badgeColor = color || "#ec4899";
  const valueText = count.toLocaleString();

  const labelW = textWidth(label) + 10;
  const valueW = Math.max(textWidth(valueText) + 10, 24);
  const totalW = labelW + valueW;

  const h = style === "rounded" ? 22 : 20;
  const rx = style === "flat-square" ? 0 : style === "rounded" ? 11 : 3;
  const ty = Math.round(h / 2 + 4);

  const shadow = style !== "flat-square"
    ? `<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>`
    : "";
  const shadowRect = style !== "flat-square"
    ? `<rect width="${totalW}" height="${h}" fill="url(#s)"/>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${totalW}" height="${h}" role="img" aria-label="${label}: ${valueText}">
  <title>${label}: ${valueText}</title>
  ${shadow}
  <clipPath id="r"><rect width="${totalW}" height="${h}" rx="${rx}" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="${h}" fill="${labelColor}"/>
    <rect x="${labelW}" width="${valueW}" height="${h}" fill="${badgeColor}"/>
    ${shadowRect}
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text aria-hidden="true" x="${labelW / 2}" y="${ty}" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelW / 2}" y="${ty - 1}">${label}</text>
    <text aria-hidden="true" x="${labelW + valueW / 2}" y="${ty}" fill="#010101" fill-opacity=".3">${valueText}</text>
    <text x="${labelW + valueW / 2}" y="${ty - 1}">${valueText}</text>
  </g>
</svg>`;
}

// ── 싸이월드 배지 ──
function cyworldBadge(total: number, today: number, options: BadgeOptions): string {
  const accent = options.color || "#cc0000";
  const todayStr = today.toLocaleString();
  const totalStr = total.toLocaleString();
  const tvw = textWidth(todayStr);
  const tlw = textWidth(totalStr);
  const w = Math.ceil(44 + tvw + 16 + 46 + tlw + 4);
  const h = 20;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" role="img">
  <rect width="${w}" height="${h}" rx="3" fill="#fff" stroke="#e5e5e5" stroke-width="0.5"/>
  <g font-family="Verdana,Tahoma,sans-serif" text-rendering="geometricPrecision">
    <text x="6" y="14" font-size="9" fill="#999" letter-spacing="0.5">TODAY</text>
    <text x="48" y="14" font-size="9" font-weight="bold" fill="${accent}">${todayStr}</text>
    <text x="${54 + tvw}" y="14" font-size="9" fill="#ddd">|</text>
    <text x="${64 + tvw}" y="14" font-size="9" fill="#999" letter-spacing="0.5">TOTAL</text>
    <text x="${108 + tvw}" y="14" font-size="9" font-weight="bold" fill="#555">${totalStr}</text>
  </g>
</svg>`;
}

function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `#${[r, g, b].map((c) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, "0")).join("")}`;
}
