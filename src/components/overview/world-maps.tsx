"use client";

import { useMemo } from "react";
import { geoPath, geoMercator } from "d3-geo";
import type { GeoPermissibleObjects, GeoProjection } from "d3-geo";
import type { SiteData } from "../dashboard-view";
import { useGeo, ZoomableSVG } from "./zoomable-svg";
import { decodeCity, CITY_COORDS, CITY_COUNTRY_MAP, CITY_KR, CITY_TO_US_STATE, GEO_URLS } from "./geo-data";

// 도시 dot (choropleth 없는 지도용)
export function CityDots({ cities, country, projection, accent }: {
  cities: SiteData["cities"]; country: string;
  projection: GeoProjection; accent: string;
}) {
  const mapped = useMemo(() => cities
    .map((c) => {
      const n = decodeCity(c.city); if (!n || CITY_COUNTRY_MAP[n] !== country) return null;
      const co = CITY_COORDS[n]; if (!co) return null;
      const pos = projection([co[1], co[0]]); if (!pos) return null;
      return { name: n, x: pos[0], y: pos[1], count: Number(c.count) };
    })
    .filter(Boolean) as { name: string; x: number; y: number; count: number }[],
    [cities, country, projection]
  );
  const maxCount = Math.max(...mapped.map((c) => c.count), 1);
  const top3 = new Set([...mapped].sort((a, b) => b.count - a.count).slice(0, 3).map((c) => c.name));
  return (
    <>
      {mapped.map((city) => {
        const r = 3 + (city.count / maxCount) * 10;
        const label = CITY_KR[city.name] ?? city.name;
        return (
          <g key={city.name}>
            <circle cx={city.x.toFixed(1)} cy={city.y.toFixed(1)} r={r.toFixed(1)}
              fill={accent} fillOpacity="0.7" stroke="white" strokeWidth="0.8"
              vectorEffect="non-scaling-stroke" />
            {top3.has(city.name) && (
              <text x={city.x.toFixed(1)} y={(city.y - r - 2).toFixed(1)}
                textAnchor="middle" fontSize="7" fontWeight="700" fill="#3f3f46"
                stroke="white" strokeWidth="2" paintOrder="stroke" fontFamily="inherit">
                {label}
              </text>
            )}
          </g>
        );
      })}
    </>
  );
}

const US_STATE_ABBR: Record<string, string> = {
  Alabama:"AL",Alaska:"AK",Arizona:"AZ",Arkansas:"AR",California:"CA",
  Colorado:"CO",Connecticut:"CT",Delaware:"DE",Florida:"FL",Georgia:"GA",
  Hawaii:"HI",Idaho:"ID",Illinois:"IL",Indiana:"IN",Iowa:"IA",
  Kansas:"KS",Kentucky:"KY",Louisiana:"LA",Maine:"ME",Maryland:"MD",
  Massachusetts:"MA",Michigan:"MI",Minnesota:"MN",Mississippi:"MS",Missouri:"MO",
  Montana:"MT",Nebraska:"NE",Nevada:"NV","New Hampshire":"NH","New Jersey":"NJ",
  "New Mexico":"NM","New York":"NY","North Carolina":"NC","North Dakota":"ND",Ohio:"OH",
  Oklahoma:"OK",Oregon:"OR",Pennsylvania:"PA","Rhode Island":"RI","South Carolina":"SC",
  "South Dakota":"SD",Tennessee:"TN",Texas:"TX",Utah:"UT",Vermont:"VT",
  Virginia:"VA",Washington:"WA","West Virginia":"WV",Wisconsin:"WI",Wyoming:"WY",
};

// ─── 미국 주 choropleth ───────────────────────────────────────────────────────

export function USMap({ cities, accent }: { cities: SiteData["cities"]; accent: string }) {
  const geo = useGeo(GEO_URLS.US);
  const W = 300, H = 185;

  const stateCounts = useMemo(() => {
    const m: Record<string, number> = {};
    cities.forEach((c) => {
      const n = decodeCity(c.city);
      if (!n || CITY_COUNTRY_MAP[n] !== "US") return;
      const state = CITY_TO_US_STATE[n];
      if (state) m[state] = (m[state] ?? 0) + Number(c.count);
    });
    return m;
  }, [cities]);

  const { features } = useMemo(() => {
    if (!geo) return { features: [] };
    // 본토 48주만 (알래스카=02, 하와이=15 제외, 영토 60+ 제외)
    const continental = { ...geo, features: geo.features.filter((f) => {
      const id = Number((f as GeoJSON.Feature).id);
      return !isNaN(id) && id <= 56 && id !== 2 && id !== 15;
    })};
    const proj = geoMercator().fitExtent([[8, 8], [W - 8, H - 8]], continental);
    const gen = geoPath(proj);
    const feats = continental.features.map((f, i) => {
      const props = (f as GeoJSON.Feature).properties as { name: string };
      const count = stateCounts[props.name] ?? 0;
      const [cx, cy] = gen.centroid(f as GeoPermissibleObjects);
      const abbr = US_STATE_ABBR[props.name] ?? "";
      return { d: gen(f as GeoPermissibleObjects) ?? "", name: props.name, count, key: i, cx, cy, abbr };
    });
    return { features: feats };
  }, [geo, stateCounts]);

  const maxCount = Math.max(...features.map((f) => f.count), 1);

  if (!geo) return <div className="h-44 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />;

  return (
    <ZoomableSVG vw={W} vh={H} className="w-full" style={{ background: "#f4f4f5" }}>
      {features.map(({ d, count, key, cx, cy, abbr }) => {
        const t = count / maxCount;
        const hasCount = count > 0;
        return (
          <g key={key}>
            <path d={d}
              fill={hasCount ? accent : "#e4e4e7"}
              fillOpacity={hasCount ? 0.15 + t * 0.78 : 1}
              stroke="white" strokeWidth="0.5"
              vectorEffect="non-scaling-stroke" />
            {abbr && !isNaN(cx) && !isNaN(cy) && (
              <text x={cx.toFixed(1)} y={(cy + 3).toFixed(1)}
                textAnchor="middle" fontSize="4.5" fontWeight="600" fontFamily="inherit"
                fill={hasCount ? (t > 0.5 ? "white" : accent) : "#a1a1aa"}
                style={{ pointerEvents: "none", userSelect: "none" }}>
                {abbr}
              </text>
            )}
          </g>
        );
      })}
    </ZoomableSVG>
  );
}

// ─── 일본/기타 국가 지도 ──────────────────────────────────────────────────────

export function CountryMap({ cities, country, accent }: {
  cities: SiteData["cities"]; country: string; accent: string;
}) {
  const geoUrl = country === "JP" ? GEO_URLS.JP : GEO_URLS.WORLD;
  const allGeo = useGeo(geoUrl);
  const W = 300, H = 185;

  const geo = useMemo<GeoJSON.FeatureCollection | null>(() => {
    if (!allGeo) return null;
    if (country === "JP") return allGeo;
    const ISO_NUMERIC: Record<string, string> = {
      CN:"156", GB:"826", FR:"250", DE:"276", ES:"724", IT:"380",
      NL:"528", BE:"056", SE:"752", DK:"208", CH:"756", PL:"616",
      CZ:"203", FI:"246", NO:"578", IE:"372", PT:"620", HU:"348",
      RO:"642", AT:"040",
    };
    const id = ISO_NUMERIC[country];
    const features = id ? allGeo.features.filter((f) => (f as GeoJSON.Feature).id === id) : allGeo.features;
    return { ...allGeo, features };
  }, [allGeo, country]);

  const { projection, paths } = useMemo(() => {
    if (!geo || !geo.features.length) return { projection: geoMercator(), paths: [] };
    const proj = geoMercator().fitExtent([[10, 10], [W - 10, H - 10]], geo);
    const gen = geoPath(proj);
    return {
      projection: proj,
      paths: geo.features.map((f, i) => ({ d: gen(f as GeoPermissibleObjects) ?? "", key: i })),
    };
  }, [geo, country]);

  if (!geo) return <div className="h-44 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />;

  return (
    <ZoomableSVG vw={W} vh={H} className="w-full" style={{ background: "#f4f4f5" }}>
      {paths.map((p) => (
        <path key={p.key} d={p.d} fill="#e4e4e7" stroke="#d1d1d1" strokeWidth="0.5"
          vectorEffect="non-scaling-stroke" />
      ))}
      <CityDots cities={cities} country={country} projection={projection} accent={accent} />
    </ZoomableSVG>
  );
}
