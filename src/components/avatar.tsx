"use client";

import { useImageLoader } from "@m1kapp/kit";

const RING_GRADIENT = "linear-gradient(135deg, #f9a825, #f06292, #ab47bc, #5c6bc0)";

// ─── Avatar 컴포넌트 ─────────────────────────────────────────────

interface AvatarProps {
  imageUrl?: string | null;
  /** 순서대로 시도할 후보 URL 목록. imageUrl 대신 사용 */
  candidates?: string[];
  name: string;
  size?: number;
  ring?: boolean;
  rounded?: string;
  bg?: string;
  className?: string;
  style?: React.CSSProperties;
}

/** 이미지 + 로딩/실패 폴백 레이어 (이니셜) */
function AvatarPhoto({ urls, name, rounded, fontSize, bg }: {
  urls: string[]; name: string; rounded: string; fontSize: string; bg?: string;
}) {
  const { status, url, refCallback, handleLoad, handleError } = useImageLoader(urls);

  const fallbackBg = bg ? "" : "bg-zinc-200 dark:bg-zinc-700";
  const fallbackText = bg ? "text-white/90 font-black" : "text-zinc-500 font-bold";

  return (
    <div className={`relative w-full h-full ${rounded} overflow-hidden`}>
      {/* 폴백 레이어 */}
      {status === "failed" ? (
        <div
          className={`absolute inset-0 ${rounded} ${fallbackBg} flex items-center justify-center ${fontSize} ${fallbackText}`}
          style={bg ? { backgroundColor: bg } : undefined}
        >
          {name[0]?.toUpperCase()}
        </div>
      ) : status === "loading" ? (
        <div className={`absolute inset-0 ${rounded} border border-zinc-200 dark:border-zinc-700`} />
      ) : null}

      {/* 이미지 */}
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={url}
          ref={refCallback}
          src={url}
          alt={name}
          onLoad={handleLoad}
          onError={handleError}
          className={`absolute inset-0 w-full h-full ${rounded} object-cover transition-opacity duration-150 ${
            status === "loaded" ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}

export function Avatar({
  imageUrl,
  candidates,
  name,
  size = 40,
  ring = true,
  rounded = "rounded-full",
  bg,
  className = "",
  style,
}: AvatarProps) {
  const inner = size - (ring ? 6 : 0);
  const fontSize = inner < 28 ? "text-[10px]" : inner < 36 ? "text-xs" : "text-sm";

  // imageUrl / candidates를 하나의 배열로 통합
  const urls = candidates?.length ? candidates : imageUrl ? [imageUrl] : [];

  const photo = <AvatarPhoto urls={urls} name={name} rounded={rounded} fontSize={fontSize} bg={bg} />;

  if (!ring) {
    return (
      <div
        className={`shrink-0 ${rounded} overflow-hidden ${className}`}
        style={{ width: size, height: size, ...style }}
      >
        {photo}
      </div>
    );
  }

  return (
    <div
      className={`shrink-0 rounded-full p-[2.5px] ${className}`}
      style={{ width: size + 5, height: size + 5, background: RING_GRADIENT }}
    >
      <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 p-[2px]">
        {photo}
      </div>
    </div>
  );
}
