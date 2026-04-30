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
    const { data, info } = await sharp(buf)
      .resize(16, 16, { fit: "cover" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // 5-bit 양자화 (32단계) → 버킷별 집계
    const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];

      // 투명/반투명 건너뜀
      if (a < 128) continue;

      // 너무 밝은 색 (흰색 계열) 건너뜀
      if (r > 230 && g > 230 && b > 230) continue;

      // 너무 어두운 색 (검정 계열) 건너뜀
      if (r < 25 && g < 25 && b < 25) continue;

      // 회색 계열 건너뜀 (채도 낮은)
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      if (max - min < 20 && max < 200) continue;

      const qr = (r >> 3) << 3, qg = (g >> 3) << 3, qb = (b >> 3) << 3;
      const key = `${qr},${qg},${qb}`;

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

    if (buckets.size === 0) return null;

    // 가장 많은 버킷
    let best = { r: 0, g: 0, b: 0, count: 0 };
    for (const bucket of buckets.values()) {
      if (bucket.count > best.count) best = bucket;
    }

    // 평균 색상
    const avgR = Math.round(best.r / best.count);
    const avgG = Math.round(best.g / best.count);
    const avgB = Math.round(best.b / best.count);

    return `#${avgR.toString(16).padStart(2, "0")}${avgG.toString(16).padStart(2, "0")}${avgB.toString(16).padStart(2, "0")}`;
  } catch {
    return null;
  }
}
