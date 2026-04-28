"use client";

// 인스타그램 스타일 그라디언트 링 아바타 — 앱 전체 공용
const RING_GRADIENT = "linear-gradient(135deg, #f9a825, #f06292, #ab47bc, #5c6bc0)";

interface AvatarProps {
  imageUrl?: string | null;
  name: string;
  size?: number;       // px (기본 40)
  ring?: boolean;      // 그라디언트 링 여부 (기본 true)
  className?: string;
}

export function Avatar({ imageUrl, name, size = 40, ring = true, className = "" }: AvatarProps) {
  const inner = size - (ring ? 6 : 0); // 링 두께 3px 양쪽
  const fontSize = inner < 28 ? "text-[10px]" : inner < 36 ? "text-xs" : "text-sm";

  const photo = imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageUrl} alt={name}
      className="w-full h-full rounded-full object-cover" />
  ) : (
    <div className={`w-full h-full rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center ${fontSize} font-bold text-zinc-500`}>
      {name[0]?.toUpperCase()}
    </div>
  );

  if (!ring) {
    return (
      <div className={`shrink-0 rounded-full overflow-hidden ${className}`}
        style={{ width: size, height: size }}>
        {photo}
      </div>
    );
  }

  return (
    <div className={`shrink-0 rounded-full p-[2.5px] ${className}`}
      style={{ width: size + 5, height: size + 5, background: RING_GRADIENT }}>
      <div className="w-full h-full rounded-full bg-white dark:bg-zinc-900 p-[2px]">
        {photo}
      </div>
    </div>
  );
}
