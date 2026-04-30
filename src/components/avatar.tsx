"use client";

import { useState, useCallback } from "react";

const RING_GRADIENT = "linear-gradient(135deg, #f9a825, #f06292, #ab47bc, #5c6bc0)";

// ─── 이미지 로딩 훅 ──────────────────────────────────────────────

type ImgState = { idx: number; status: "loading" | "loaded" | "failed" };

/**
 * URL 배열을 받아 순서대로 시도, 성공하면 "loaded", 전부 실패하면 "failed".
 * 캐시된 이미지(img.complete)도 정상 처리.
 */
function useImageLoader(urls: string[]) {
  const key = urls.join("\0");

  const [state, setState] = useState<ImgState & { _key: string }>(() => ({
    idx: 0,
    status: urls.length > 0 ? "loading" : "failed",
    _key: key,
  }));

  // key가 바뀔 때 렌더 시점에서 리셋 (useEffect 대신 — ref callback과 경쟁 방지)
  if (state._key !== key) {
    setState({ idx: 0, status: urls.length > 0 ? "loading" : "failed", _key: key });
  }

  const url = state.idx < urls.length ? urls[state.idx] : null;

  function tryNext() {
    setState((prev) => {
      if (prev.status !== "loading") return prev;
      const next = prev.idx + 1;
      return { ...prev, idx: next, status: next < urls.length ? "loading" : "failed" };
    });
  }

  function markLoaded() {
    setState((prev) => (prev.status === "loading" ? { ...prev, status: "loaded" } : prev));
  }

  function checkImg(img: HTMLImageElement) {
    if (img.naturalWidth >= 8 && img.naturalHeight >= 8) markLoaded();
    else tryNext();
  }

  function handleLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    checkImg(e.currentTarget);
  }

  // useCallback: url이 바뀔 때만 새 ref 콜백 생성 → 불필요한 null+element 호출 방지
  const refCallback = useCallback((el: HTMLImageElement | null) => {
    if (el && el.complete) {
      if (el.naturalWidth >= 8 && el.naturalHeight >= 8) markLoaded();
      else tryNext();
    }
  }, [url]);

  return {
    status: url ? state.status : ("failed" as const),
    url,
    refCallback,
    handleLoad,
    handleError: tryNext,
  };
}

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
  const { status, url, refCallback, handleLoad, handleError } = useImageLoader(urls);

  const fallbackBg = bg ? "" : "bg-zinc-200 dark:bg-zinc-700";
  const fallbackText = bg ? "text-white/90 font-black" : "text-zinc-500 font-bold";

  const photo = (
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
