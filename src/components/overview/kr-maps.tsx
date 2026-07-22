"use client";

import { useMemo } from "react";
import { geoPath, geoMercator } from "d3-geo";
import type { GeoPermissibleObjects } from "d3-geo";
import type { SiteData } from "../dashboard-view";
import { useGeo, ZoomableSVG } from "./zoomable-svg";
import { ChoroplethPath } from "./map-primitives";
import { decodeCity, SEOUL_GU_SET, CITY_TO_KR_PROVINCE, GEO_URLS } from "./geo-data";

// ─── 한국 시/도 choropleth ────────────────────────────────────────────────────

export function KoreaMap({ cities, accent }: { cities: SiteData["cities"]; accent: string }) {
  const geo = useGeo(GEO_URLS.KR);
  const W = 320, H = 370;
  // 제주 인셋 박스
  const INSET_W = 74, INSET_H = 48, INSET_X = 4, INSET_Y = H - INSET_H - 2;

  const provinceCounts = useMemo(() => {
    const m: Record<string, number> = {};
    cities.forEach((c) => {
      const n = decodeCity(c.city); if (!n) return;
      if (SEOUL_GU_SET.has(n)) { m["Seoul"] = (m["Seoul"] ?? 0) + Number(c.count); return; }
      const prov = CITY_TO_KR_PROVINCE[n];
      if (prov) m[prov] = (m[prov] ?? 0) + Number(c.count);
    });
    return m;
  }, [cities]);

  const { mainFeatures, jejuFeature } = useMemo(() => {
    if (!geo) return { mainFeatures: [], jejuFeature: null };

    // 본토 / 제주 분리
    const mainland = geo.features.filter((f) => (f.properties as { name_eng: string }).name_eng !== "Jeju-do");
    const jeju = geo.features.find((f) => (f.properties as { name_eng: string }).name_eng === "Jeju-do");
    const mainlandGeo = { type: "FeatureCollection" as const, features: mainland };

    // 본토 projection — 제주 제외하여 더 크게, 여백 최소화
    const mainProj = geoMercator().fitExtent([[0, 0], [W, INSET_Y - 2]], mainlandGeo);
    const mainGen = geoPath(mainProj);
    const mainFeats = mainland.map((f, i) => {
      const props = f.properties as { name: string; name_eng: string };
      const count = provinceCounts[props.name_eng] ?? 0;
      const centroid = mainGen.centroid(f as GeoPermissibleObjects);
      return { d: mainGen(f as GeoPermissibleObjects) ?? "", props, count, centroid, key: i };
    });

    // 제주 인셋 projection
    let jejuFeat = null;
    if (jeju) {
      const jejuGeo = { type: "FeatureCollection" as const, features: [jeju] };
      const jejuProj = geoMercator().fitExtent(
        [[INSET_X + 6, INSET_Y + 6], [INSET_X + INSET_W - 6, INSET_Y + INSET_H - 6]],
        jejuGeo,
      );
      const jejuGen = geoPath(jejuProj);
      const props = jeju.properties as { name: string; name_eng: string };
      const count = provinceCounts[props.name_eng] ?? 0;
      const centroid = jejuGen.centroid(jeju as GeoPermissibleObjects);
      jejuFeat = { d: jejuGen(jeju as GeoPermissibleObjects) ?? "", props, count, centroid };
    }

    return { mainFeatures: mainFeats, jejuFeature: jejuFeat };
  }, [geo, provinceCounts]);

  const maxCount = Math.max(...mainFeatures.map((f) => f.count), jejuFeature?.count ?? 0, 1);

  if (!geo) return <div className="h-64 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />;

  function renderRegion(d: string, count: number, props: { name: string }, centroid: [number, number], key: number | string, fontSize = 6.5) {
    const t = count / maxCount;
    const hasData = count > 0;
    return (
      <g key={key}>
        <ChoroplethPath d={d} t={t} active={hasData} accent={accent} />
        {centroid && !isNaN(centroid[0]) && hasData && (
          <text x={centroid[0].toFixed(1)} y={centroid[1].toFixed(1)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={fontSize} fontWeight="600" fontFamily="inherit"
            fill={t > 0.55 ? "white" : accent}
            stroke={t > 0.55 ? "transparent" : "white"}
            strokeWidth="2" paintOrder="stroke"
            style={{ pointerEvents: "none" }}>
            {props.name}
          </text>
        )}
      </g>
    );
  }

  return (
    <ZoomableSVG vw={W} vh={H} className="w-full" style={{ background: "#f4f4f5" }}>
      {/* 본토 */}
      {mainFeatures.map(({ d, count, props, centroid, key }) =>
        renderRegion(d, count, props, centroid, key),
      )}

      {/* 제주 인셋 */}
      {jejuFeature && (
        <>
          <rect x={INSET_X} y={INSET_Y} width={INSET_W} height={INSET_H} rx="4"
            fill="#f4f4f5" stroke="#d4d4d8" strokeWidth="0.5" strokeDasharray="2 1.5" />
          {renderRegion(jejuFeature.d, jejuFeature.count, jejuFeature.props, jejuFeature.centroid, "jeju", 5)}
        </>
      )}
    </ZoomableSVG>
  );
}

// ─── 서울 구 choropleth ───────────────────────────────────────────────────────

export function SeoulGuMap({ cities, accent }: { cities: SiteData["cities"]; accent: string }) {
  const geo = useGeo(GEO_URLS.SEOUL);
  const W = 300, H = 280;

  const guCounts = useMemo(() => {
    const m: Record<string, number> = {};
    cities.forEach((c) => {
      const n = decodeCity(c.city);
      if (n) m[n] = (m[n] ?? 0) + Number(c.count);
    });
    return m;
  }, [cities]);

  const { features } = useMemo(() => {
    if (!geo) return { features: [] };
    const proj = geoMercator().fitExtent([[16, 16], [W - 16, H - 16]], geo);
    const gen = geoPath(proj);
    const feats = geo.features.map((f) => {
      const props = f.properties as { name: string; name_eng: string };
      const count = guCounts[props.name_eng] ?? 0;
      const centroid = gen.centroid(f as GeoPermissibleObjects);
      return { d: gen(f as GeoPermissibleObjects) ?? "", nameKr: props.name, count, centroid };
    });
    return { features: feats };
  }, [geo, guCounts]);

  const maxCount = Math.max(...features.map((f) => f.count), 1);

  if (!geo) return <div className="h-56 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />;

  return (
    <ZoomableSVG vw={W} vh={H} className="w-full" style={{ background: "#f0f0f2" }}>
      {features.map(({ d, nameKr, count, centroid }, i) => {
        const t = count / maxCount;
        const hasData = count > 0;
        const isLight = t < 0.5;
        const textFill = hasData ? (isLight ? accent : "white") : "#a1a1aa";
        return (
          <g key={i}>
            <ChoroplethPath d={d} t={t} active={hasData} accent={accent}
              empty="#e2e2e6" base={0.18} span={0.72} strokeWidth={0.8} />
            {centroid && !isNaN(centroid[0]) && (
              <>
                <text x={centroid[0].toFixed(1)} y={(centroid[1] - (hasData ? 3.5 : 0)).toFixed(1)}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize="5.5" fontWeight="600" fill={textFill} fontFamily="inherit"
                  style={{ pointerEvents: "none" }}>
                  {nameKr}
                </text>
                {hasData && (
                  <text x={centroid[0].toFixed(1)} y={(centroid[1] + 4.5).toFixed(1)}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="5" fill={textFill} fontFamily="inherit"
                    style={{ pointerEvents: "none" }}>
                    {count.toLocaleString()}
                  </text>
                )}
              </>
            )}
          </g>
        );
      })}
    </ZoomableSVG>
  );
}
