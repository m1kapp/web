import sharp from "sharp";

const FAVICON_CANDIDATES = (origin: string) => [
  `${origin}/apple-touch-icon.png`,
  `${origin}/apple-touch-icon-precomposed.png`,
  `${origin}/favicon-32.png`,
  `${origin}/favicon.ico`,
];

/** 사이트 URL에서 유효한 favicon URL을 순서대로 조회해 반환. 없으면 null */
export async function resolveFavicon(siteUrl: string): Promise<string | null> {
  let origin: string;
  try {
    origin = new URL(siteUrl).origin;
  } catch {
    return null;
  }

  for (const candidate of FAVICON_CANDIDATES(origin)) {
    try {
      const res = await fetch(candidate, {
        method: "HEAD",
        signal: AbortSignal.timeout(3000),
        redirect: "follow",
      });
      const ct = res.headers.get("content-type") ?? "";
      if (res.ok && (ct.startsWith("image/") || candidate.endsWith(".ico"))) {
        return candidate;
      }
    } catch {
      // 타임아웃 or 네트워크 오류 → 다음 후보
    }
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
