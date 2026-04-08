export interface OgData {
  title: string | null;
  description: string | null;
  image: string | null;
}

export async function scrapeOg(url: string): Promise<OgData> {
  try {
    // 네이버 블로그 특수 처리: 모바일 URL이 OG 태그를 가짐
    const fetchUrl = toMobileUrl(url);

    const res = await fetch(fetchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; m1k-bot/1.0; +https://m1k.vercel.app)",
      },
      signal: AbortSignal.timeout(8000),
      redirect: "follow",
    });

    if (!res.ok) return { title: null, description: null, image: null };

    const html = await res.text();

    const title =
      extractMeta(html, "og:title") ||
      extractMeta(html, "twitter:title") ||
      extractTag(html, "title");

    const description =
      extractMeta(html, "og:description") ||
      extractMeta(html, "twitter:description") ||
      extractMeta(html, "description");

    let image =
      extractMeta(html, "og:image") ||
      extractMeta(html, "twitter:image");

    // 상대경로 → 절대경로
    if (image && !image.startsWith("http")) {
      image = `https://${url}${image.startsWith("/") ? "" : "/"}${image}`;
    }

    return { title, description, image };
  } catch {
    return { title: null, description: null, image: null };
  }
}

// 네이버 블로그 등 모바일 URL로 변환 (OG 태그가 있는 경우가 많음)
function toMobileUrl(url: string): string {
  // blog.naver.com/userid → m.blog.naver.com/userid
  if (/^blog\.naver\.com\//.test(url)) {
    return `https://m.${url}`;
  }
  return `https://${url}`;
}

function extractMeta(html: string, property: string): string | null {
  // property="og:xxx" content="..." 또는 name="description" content="..."
  const patterns = [
    new RegExp(
      `<meta[^>]*(?:property|name)=["']${escRe(property)}["'][^>]*content=["']([^"']*)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${escRe(property)}["']`,
      "i"
    ),
  ];

  for (const re of patterns) {
    const match = html.match(re);
    if (match?.[1]?.trim()) return decodeEntities(match[1].trim());
  }
  return null;
}

function extractTag(html: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
  const match = html.match(regex);
  return match?.[1]?.trim() ? decodeEntities(match[1].trim()) : null;
}

function escRe(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
