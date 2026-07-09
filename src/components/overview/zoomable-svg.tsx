"use client";

import { useState, useEffect, useRef } from "react";

// GeoJSON 캐시
const geoCache = new Map<string, GeoJSON.FeatureCollection>();
async function fetchGeo(url: string): Promise<GeoJSON.FeatureCollection> {
  if (geoCache.has(url)) return geoCache.get(url)!;
  const res = await fetch(url);
  const data: GeoJSON.FeatureCollection = await res.json();
  geoCache.set(url, data);
  return data;
}

export function useGeo(url: string) {
  const [geo, setGeo] = useState<GeoJSON.FeatureCollection | null>(null);
  useEffect(() => { fetchGeo(url).then(setGeo).catch(() => {}); }, [url]);
  return geo;
}

// ─── 줌/패닝 SVG 래퍼 ────────────────────────────────────────────────────────

const ZOOM_STEPS = [1, 1.5, 2, 3, 5, 8];

type Transform = { x: number; y: number; s: number };

export function ZoomableSVG({ vw, vh, className, style, children }: {
  vw: number; vh: number; className?: string;
  style?: React.CSSProperties; children: React.ReactNode;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [t, setT] = useState<Transform>({ x: 0, y: 0, s: 1 });
  const tRef = useRef(t);
  tRef.current = t;

  function zoomTo(nextIdx: number) {
    const ns = ZOOM_STEPS[nextIdx];
    const cx = vw / 2, cy = vh / 2;
    const { x, y, s } = tRef.current;
    const nx = ns === 1 ? 0 : cx - (cx - x) * (ns / s);
    const ny = ns === 1 ? 0 : cy - (cy - y) * (ns / s);
    const next = { x: nx, y: ny, s: ns };
    tRef.current = next;
    setT(next);
    setStepIdx(nextIdx);
  }

  const drag = useRef<{ sx: number; sy: number; tx: number; ty: number } | null>(null);

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (tRef.current.s <= 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, tx: tRef.current.x, ty: tRef.current.y };
  }
  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!drag.current) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const dx = ((e.clientX - drag.current.sx) / rect.width) * vw;
    const dy = ((e.clientY - drag.current.sy) / rect.height) * vh;
    const next = { s: tRef.current.s, x: drag.current.tx + dx, y: drag.current.ty + dy };
    tRef.current = next;
    setT(next);
  }
  function onPointerUp() { drag.current = null; }

  const isZoomed = stepIdx > 0;
  const scaleLabel = ZOOM_STEPS[stepIdx] === 1 ? "1×" : `${ZOOM_STEPS[stepIdx]}×`;

  return (
    <div className="relative rounded-xl overflow-hidden">
      <svg ref={svgRef}
        viewBox={`0 0 ${vw} ${vh}`}
        className={className}
        style={{ ...style, cursor: isZoomed ? "grab" : "default", touchAction: "none", userSelect: "none" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        aria-hidden="true">
        <g transform={`translate(${t.x.toFixed(1)},${t.y.toFixed(1)}) scale(${t.s.toFixed(3)})`}>
          {children}
        </g>
      </svg>

      {/* 줌 컨트롤 */}
      <div className="absolute bottom-2 right-2 flex items-center gap-1">
        <button
          onClick={() => zoomTo(Math.max(0, stepIdx - 1))}
          disabled={stepIdx === 0}
          className="w-6 h-6 flex items-center justify-center rounded-md text-sm font-bold bg-white/85 dark:bg-zinc-800/85 text-zinc-500 dark:text-zinc-400 shadow backdrop-blur-sm disabled:opacity-30 leading-none"
        >−</button>
        <span className="text-[10px] font-semibold tabular-nums text-zinc-500 dark:text-zinc-400 bg-white/85 dark:bg-zinc-800/85 px-1.5 py-0.5 rounded-md shadow backdrop-blur-sm min-w-[28px] text-center">
          {scaleLabel}
        </span>
        <button
          onClick={() => zoomTo(Math.min(ZOOM_STEPS.length - 1, stepIdx + 1))}
          disabled={stepIdx === ZOOM_STEPS.length - 1}
          className="w-6 h-6 flex items-center justify-center rounded-md text-sm font-bold bg-white/85 dark:bg-zinc-800/85 text-zinc-500 dark:text-zinc-400 shadow backdrop-blur-sm disabled:opacity-30 leading-none"
        >+</button>
      </div>
    </div>
  );
}
