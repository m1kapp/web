/** PendingBanner, SubBadges 양쪽에서 공용으로 쓰는 마크다운 스니펫 생성 */
export function buildBadgeSnippet(host: string, slug: string): string {
  const badgeUrl = `https://${host}/badge/${slug}.svg`;
  const dashboardUrl = `https://${host}/${slug}`;
  return `[![Hits](${badgeUrl})](${dashboardUrl})`;
}

export interface BadgeOptions {
  label?: string;
  color?: string;
  labelColor?: string;
  style?: "flat" | "flat-square" | "rounded" | "cyworld";
  theme?: "light" | "dark";
}

export function generateBadge(
  count: number,
  goal: number = 1000,
  options: BadgeOptions = {},
  todayCount: number = 0
): string {
  const style = options.style || "flat";
  if (style === "cyworld") return cyworldBadge(count, todayCount, goal, options);
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
  for (const ch of text) {
    if (CHAR_WIDTHS[ch] !== undefined) {
      w += CHAR_WIDTHS[ch];
    } else if (ch.codePointAt(0)! > 0x1F00) {
      // 이모지/유니코드 심볼 — 넓게
      w += 14;
    } else {
      w += 6.5;
    }
  }
  return w;
}

type ModernStyle = Exclude<BadgeOptions["style"], "cyworld">;

const STYLE_PROPS: Record<NonNullable<ModernStyle>, { h: number; rx: number; shadow: boolean }> = {
  "flat":        { h: 20, rx: 3,  shadow: true  },
  "flat-square": { h: 20, rx: 0,  shadow: false },
  "rounded":     { h: 22, rx: 11, shadow: true  },
};

// ── 모던 배지 ──
function modernBadge(count: number, options: BadgeOptions): string {
  const { label = "m1k", color, labelColor = "#555" } = options;
  const badgeColor = color || "#ec4899";
  const valueText = count.toLocaleString();

  const labelW = textWidth(label) + 10;
  const valueW = Math.max(textWidth(valueText) + 10, 24);
  const totalW = labelW + valueW;

  const styleKey: NonNullable<ModernStyle> =
    options.style === "cyworld" || !options.style ? "flat" : options.style;
  const { h, rx, shadow: hasShadow } = STYLE_PROPS[styleKey];
  const ty = Math.round(h / 2 + 4);

  const shadow = hasShadow
    ? `<linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>`
    : "";
  const shadowRect = hasShadow
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
function cyworldBadge(total: number, today: number, goal: number, options: BadgeOptions): string {
  const dark = options.theme === "dark";
  const accent = dark ? "#fafafa" : (options.color || "#cc0000");
  const label = options.label || "";
  const todayStr = today.toLocaleString();
  const totalStr = total.toLocaleString();
  const tvw = textWidth(todayStr);

  // 테마별 색상
  const bg = dark ? "none" : "#fff";
  const border = dark ? "#3f3f46" : "#e5e5e5";
  const labelFill = dark ? "#a1a1aa" : "#bbb";
  const mutedFill = dark ? "#a1a1aa" : "#999";
  const boldFill = dark ? "#fafafa" : "#555";
  const dividerFill = dark ? "#52525b" : "#ddd";

  // 카운트 행 너비: TODAY {today} TOTAL {total}
  const countsRowW = Math.ceil(44 + tvw + 16 + 46 + textWidth(totalStr) + 4);
  // 라벨 행 너비
  const labelRowW = label ? Math.ceil(textWidth(label) * 9 / 11) + 12 : 0;

  const w = Math.max(countsRowW, labelRowW) + 12;
  const h = label ? 34 : 22;

  // 텍스트 Y 좌표
  const labelY = 14;
  const countsY = label ? 28 : 17;

  // 카운트 행 시작 x (중앙 정렬)
  const cx = Math.round((w - countsRowW) / 2);

  // 컬럼 x 좌표 (TODAY label | TODAY value | divider | TOTAL label | TOTAL value)
  const colTodayLabel = cx;
  const colTodayValue = cx + 42;
  const colDivider    = cx + 48 + tvw;
  const colTotalLabel = cx + 58 + tvw;
  const colTotalValue = cx + 102 + tvw;

  const labelSvg = label
    ? `<text x="${w / 2}" y="${labelY}" font-size="9" fill="${labelFill}" text-anchor="middle" letter-spacing="1">${label}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" role="img">
  <clipPath id="r"><rect width="${w}" height="${h}" rx="3"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${w}" height="${h}" fill="${bg}"/>
  </g>
  <rect width="${w}" height="${h}" rx="3" fill="none" stroke="${border}" stroke-width="0.5"/>
  <g font-family="Verdana,Tahoma,sans-serif" text-rendering="geometricPrecision">
    ${labelSvg}
    <text x="${colTodayLabel}" y="${countsY}" font-size="9" fill="${mutedFill}" letter-spacing="0.5">TODAY</text>
    <text x="${colTodayValue}" y="${countsY}" font-size="9" font-weight="bold" fill="${accent}">${todayStr}</text>
    <text x="${colDivider}"    y="${countsY}" font-size="9" fill="${dividerFill}">|</text>
    <text x="${colTotalLabel}" y="${countsY}" font-size="9" fill="${mutedFill}" letter-spacing="0.5">TOTAL</text>
    <text x="${colTotalValue}" y="${countsY}" font-size="9" font-weight="bold" fill="${boldFill}">${totalStr}</text>
  </g>
</svg>`;
}

