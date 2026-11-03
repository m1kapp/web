import sharp from "sharp";

const FAVICON_CANDIDATES = (origin: string) => [
  `${origin}/apple-touch-icon.png`,
  `${origin}/apple-touch-icon-precomposed.png`,
  // Next.js 파일 규칙(app/apple-icon.png) — 이게 빠지면 32px favicon이 뽑혀 앱 아이콘이 흐려진다
  `${origin}/apple-icon.png`,
  `${origin}/icon-512.png`,
  `${origin}/icon-192.png`,
  `${origin}/favicon-32.png`,
  `${origin}/favicon.ico`,
];

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"))?.[1];
const largest = (sizes?: string) => Math.max(0, ...(sizes?.match(/\d+(?=x)/g) ?? []).map(Number));

/** HTML이 선언한 아이콘 — apple-touch-icon을 먼저, 나머지는 큰 순서로. 경로 추측보다 정확하다 */
export function declaredIcons(html: string, baseUrl: string): { icons: string[]; manifest: string | null } {
  const tags = html.match(/<link\b[^>]*>/gi) ?? [];
  const rel = (tag: string) => attr(tag, "rel")?.toLowerCase() ?? "";
  const resolve = (href: string) => new URL(href.replaceAll("&amp;", "&"), baseUrl).href;
  const score = (tag: string) => (rel(tag).includes("apple-touch-icon") ? 1e6 : largest(attr(tag, "sizes")));

  const icons = tags
    .filter((tag) => rel(tag).includes("icon") && attr(tag, "href"))
    .sort((a, b) => score(b) - score(a))
    .map((tag) => resolve(attr(tag, "href")!));
  const manifest = tags.find((tag) => rel(tag) === "manifest" && attr(tag, "href"));
  return { icons, manifest: manifest ? resolve(attr(manifest, "href")!) : null };
}

async function isImage(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(3000), redirect: "follow" });
    const type = res.headers.get("content-type") ?? "";
    // SPA는 없는 파일에도 HTML을 200으로 준다 — .ico라도 HTML이면 아이콘이 아니다
    return res.ok && !type.includes("text/html") && (type.startsWith("image/") || url.includes(".ico"));
  } catch {
    return false; // 타임아웃 or 네트워크 오류 → 다음 후보
  }
}

/** 사이트가 선언한 아이콘을 먼저, 없으면 흔한 경로를 조회해 유효한 URL을 반환. 없으면 null */
export async function resolveFavicon(siteUrl: string): Promise<string | null> {
  let origin: string;
  try {
    origin = new URL(siteUrl).origin;
  } catch {
    return null;
  }

  let declared: string[] = [];
  try {
    const res = await fetch(siteUrl, { signal: AbortSignal.timeout(5000), redirect: "follow" });
    const { icons, manifest } = declaredIcons(await res.text(), res.url);
    declared = icons;
    if (manifest) {
      const data = await fetch(manifest, { signal: AbortSignal.timeout(3000) }).then((r) => r.json());
      const fromManifest = ((data.icons ?? []) as { src: string; sizes?: string; purpose?: string }[])
        .filter((icon) => !icon.purpose?.includes("maskable"))
        .sort((a, b) => largest(b.sizes) - largest(a.sizes))
        .map((icon) => new URL(icon.src, manifest).href);
      // apple-touch-icon(모서리까지 채운 앱 아이콘)이 있으면 그걸 먼저 둔다
      declared = [...icons.slice(0, 1), ...fromManifest, ...icons.slice(1)];
    }
  } catch {
    // 페이지를 못 읽으면 흔한 경로로 넘어간다
  }

  for (const candidate of new Set([...declared, ...FAVICON_CANDIDATES(origin)])) {
    if (await isImage(candidate)) return candidate;
  }
  return null;
}

/** 배경·무채색 픽셀 제외 (흰색·검정·저채도 회색·반투명) */
function isSkippablePixel(r: number, g: number, b: number, a: number): boolean {
  if (a < 128) return true;
  if (r > 230 && g > 230 && b > 230) return true;
  if (r < 25 && g < 25 && b < 25) return true;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max - min < 20 && max < 200; // 회색 계열 (채도 낮은)
}

/** RGBA 픽셀을 5-bit 양자화 버킷으로 집계해 최다 버킷의 평균색 반환 */
function dominantFromPixels(data: Buffer): { r: number; g: number; b: number } | null {
  const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (isSkippablePixel(r, g, b, a)) continue;

    const key = `${(r >> 3) << 3},${(g >> 3) << 3},${(b >> 3) << 3}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.r += r;
      existing.g += g;
      existing.b += b;
      existing.count++;
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }
  }

  let best: { r: number; g: number; b: number; count: number } | null = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.count > best.count) best = bucket;
  }
  if (!best) return null;

  return {
    r: Math.round(best.r / best.count),
    g: Math.round(best.g / best.count),
    b: Math.round(best.b / best.count),
  };
}

/** 이미지 URL에서 dominant color를 추출해 hex 반환. 실패 시 null */
export async function extractDominantColor(imageUrl: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, {
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
    });
    if (!res.ok) return null;

    const buf = Buffer.from(await res.arrayBuffer());

    // 16x16으로 축소 → raw RGBA 픽셀
    const { data } = await sharp(buf)
      .resize(16, 16, { fit: "cover" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const color = dominantFromPixels(data);
    if (!color) return null;

    const hex = (v: number) => v.toString(16).padStart(2, "0");
    return `#${hex(color.r)}${hex(color.g)}${hex(color.b)}`;
  } catch {
    return null;
  }
}
