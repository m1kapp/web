// 지도 공통 프리미티브 — kr-maps / world-maps가 공유하는 choropleth 경로·라벨.
// 세 지도(한국 시·도, 서울 구, 미국 주)가 동일한 <path> 채색 규칙을 반복하던 것을
// 한 곳으로 모아 중복을 제거. 상수(빈칸색·불투명도·선굵기)는 지도별로 prop 주입.

// choropleth 한 조각 — 값 있으면 accent 농도, 없으면 회색.
export function ChoroplethPath({
  d, t, active, accent,
  empty = "#e4e4e7", base = 0.15, span = 0.78, strokeWidth = 0.7,
}: {
  d: string; t: number; active: boolean; accent: string;
  empty?: string; base?: number; span?: number; strokeWidth?: number;
}) {
  return (
    <path d={d}
      fill={active ? accent : empty}
      fillOpacity={active ? base + t * span : 1}
      stroke="white" strokeWidth={strokeWidth}
      vectorEffect="non-scaling-stroke" />
  );
}
