"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { geoPath, geoMercator } from "d3-geo";
import type { GeoPermissibleObjects, GeoProjection } from "d3-geo";
import { useAccent } from "@/lib/theme-context";
import { countryFlag } from "@/lib/format";
import type { SiteData } from "./dashboard-view";

// GeoJSON 캐시
const geoCache = new Map<string, GeoJSON.FeatureCollection>();
async function fetchGeo(url: string): Promise<GeoJSON.FeatureCollection> {
  if (geoCache.has(url)) return geoCache.get(url)!;
  const res = await fetch(url);
  const data: GeoJSON.FeatureCollection = await res.json();
  geoCache.set(url, data);
  return data;
}

function useGeo(url: string) {
  const [geo, setGeo] = useState<GeoJSON.FeatureCollection | null>(null);
  useEffect(() => { fetchGeo(url).then(setGeo).catch(() => {}); }, [url]);
  return geo;
}

// ─── 줌/패닝 SVG 래퍼 ────────────────────────────────────────────────────────

const ZOOM_STEPS = [1, 1.5, 2, 3, 5, 8];

type Transform = { x: number; y: number; s: number };

function ZoomableSVG({ vw, vh, className, style, children }: {
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

// ─── 도시 좌표 테이블 ─────────────────────────────────────────────────────────

const CITY_COORDS: Record<string, [number, number]> = {
  // 한국
  Seoul: [37.5665, 126.978], Busan: [35.1796, 129.0756], Incheon: [37.4563, 126.7052],
  Daegu: [35.8714, 128.6014], Daejeon: [36.3504, 127.3845], Gwangju: [35.1595, 126.8526],
  Ulsan: [35.5384, 129.3114], Suwon: [37.2636, 127.0286], Seongnam: [37.4449, 127.1388],
  Goyang: [37.6584, 126.832], Yongin: [37.2411, 127.1775], Changwon: [35.2322, 128.6811],
  Cheongju: [36.6424, 127.489], Jeonju: [35.8242, 127.148], Ansan: [37.3219, 126.8309],
  Bucheon: [37.4989, 126.783], Cheonan: [36.8151, 127.1139], Anyang: [37.3943, 126.9568],
  Pohang: [36.019, 129.3435], Jeju: [33.489, 126.4983], Uijeongbu: [37.738, 127.0472],
  Gimhae: [35.2342, 128.8811], Namyangju: [37.636, 127.2165], Hwaseong: [37.1996, 126.8314],
  Pyeongtaek: [36.9921, 127.1128], Siheung: [37.38, 126.803], Gimpo: [37.6153, 126.7158],
  Hanam: [37.5395, 127.2147], Paju: [37.7601, 126.78], Asan: [36.7898, 127.0018],
  Gimcheon: [36.1197, 128.1167], Iksan: [35.9483, 126.9545], Gyeongju: [35.8562, 129.2247],
  Gumi: [36.1196, 128.3441], Wonju: [37.342, 127.9202], Chuncheon: [37.8813, 127.7298],
  Mokpo: [34.8118, 126.3922], Jinju: [35.1799, 128.1076], Andong: [36.5684, 128.7294],
  // 일본
  Tokyo: [35.6762, 139.6503], Osaka: [34.6937, 135.5023], Yokohama: [35.4437, 139.638],
  Nagoya: [35.1815, 136.9066], Sapporo: [43.0618, 141.3545], Fukuoka: [33.5904, 130.4017],
  Kobe: [34.6901, 135.1956], Kyoto: [35.0116, 135.7681], Hiroshima: [34.3853, 132.4553],
  // 미국
  "New York": [40.7128, -74.006], "Los Angeles": [34.0522, -118.2437], Chicago: [41.8781, -87.6298],
  Houston: [29.7604, -95.3698], Phoenix: [33.4484, -112.074], Philadelphia: [39.9526, -75.1652],
  "San Antonio": [29.4241, -98.4936], "San Diego": [32.7157, -117.1611], Dallas: [32.7767, -96.797],
  "San Jose": [37.3382, -121.8863], Austin: [30.2672, -97.7431], Seattle: [47.6062, -122.3321],
  "San Francisco": [37.7749, -122.4194], Denver: [39.7392, -104.9903], Boston: [42.3601, -71.0589],
  Atlanta: [33.749, -84.388], Miami: [25.7617, -80.1918], Portland: [45.5231, -122.6765],
  "Las Vegas": [36.1699, -115.1398], Detroit: [42.3314, -83.0458], Nashville: [36.1627, -86.7816],
  Minneapolis: [44.9778, -93.265], Charlotte: [35.2271, -80.8431],
  // 유럽
  London: [51.5074, -0.1278], Paris: [48.8566, 2.3522], Berlin: [52.52, 13.405],
  Madrid: [40.4168, -3.7038], Rome: [41.9028, 12.4964], Amsterdam: [52.3676, 4.9041],
  Vienna: [48.2082, 16.3738], Brussels: [50.8503, 4.3517], Stockholm: [59.3293, 18.0686],
  Copenhagen: [55.6761, 12.5683], Zurich: [47.3769, 8.5417], Munich: [48.1351, 11.582],
  Milan: [45.4654, 9.1859], Barcelona: [41.3851, 2.1734], Warsaw: [52.2297, 21.0122],
  Prague: [50.0755, 14.4378], Helsinki: [60.1699, 24.9384], Oslo: [59.9139, 10.7522],
  Dublin: [53.3498, -6.2603], Lisbon: [38.7223, -9.1393], Budapest: [47.4979, 19.0402],
  Bucharest: [44.4268, 26.1025], Hamburg: [53.5753, 10.0153],
  // 중국
  Beijing: [39.9042, 116.4074], Shanghai: [31.2304, 121.4737], Guangzhou: [23.1291, 113.2644],
  Shenzhen: [22.5431, 114.0579], Chengdu: [30.5728, 104.0668], Hangzhou: [30.2741, 120.1551],
  Wuhan: [30.5928, 114.3055], Nanjing: [32.0603, 118.7969],
  // 기타 아시아
  Singapore: [1.3521, 103.8198], Bangkok: [13.7563, 100.5018], "Hong Kong": [22.3193, 114.1694],
  Taipei: [25.033, 121.5654], Manila: [14.5995, 120.9842], Jakarta: [-6.2088, 106.8456],
  "Kuala Lumpur": [3.139, 101.6869], "Ho Chi Minh City": [10.8231, 106.6297], Hanoi: [21.0285, 105.8542],
  Mumbai: [19.076, 72.8777], Delhi: [28.7041, 77.1025], Bangalore: [12.9716, 77.5946],
  Chennai: [13.0827, 80.2707], Kolkata: [22.5726, 88.3639],
  // 오세아니아
  Sydney: [-33.8688, 151.2093], Melbourne: [-37.8136, 144.9631], Brisbane: [-27.4698, 153.0251],
  Perth: [-31.9505, 115.8605], Auckland: [-36.8509, 174.7645],
  // 아메리카
  Toronto: [43.6532, -79.3832], Vancouver: [49.2827, -123.1207], Montreal: [45.5017, -73.5673],
  "Mexico City": [19.4326, -99.1332], "São Paulo": [-23.5505, -46.6333],
  "Rio de Janeiro": [-22.9068, -43.1729], "Buenos Aires": [-34.6037, -58.3816],
  Santiago: [-33.4489, -70.6693], Lima: [-12.0464, -77.0428], Bogotá: [4.711, -74.0721],
  // 중동·아프리카
  Dubai: [25.2048, 55.2708], Istanbul: [41.0082, 28.9784], Cairo: [30.0444, 31.2357],
  Lagos: [6.5244, 3.3792], Nairobi: [-1.2921, 36.8219], Johannesburg: [-26.2041, 28.0473],
  "Tel Aviv": [32.0853, 34.7818], Riyadh: [24.7136, 46.6753],
  // 러시아
  Moscow: [55.7558, 37.6176], "Saint Petersburg": [59.9311, 30.3609],
};

function decodeCity(city: string | null): string | null {
  if (!city) return null;
  try { return decodeURIComponent(city); } catch { return city; }
}

// ─── 국가 바 ──────────────────────────────────────────────────────────────────

function CountryBars({ countries }: { countries: SiteData["countries"] }) {
  const { accent } = useAccent();
  const filtered = countries.filter((c) => c.country !== null && c.country !== "");
  if (!filtered.length) return null;
  const max = Math.max(...filtered.map((c) => Number(c.count)));
  return (
    <div className="space-y-2.5">
      {filtered.slice(0, 5).map((c) => {
        const pct = (Number(c.count) / max) * 100;
        return (
          <div key={c.country} className="flex items-center gap-2">
            <span className="text-lg leading-none w-6 shrink-0">{countryFlag(c.country)}</span>
            <span className="text-[12px] text-zinc-500 dark:text-zinc-400 w-24 truncate shrink-0">{c.country}</span>
            <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: accent }} />
            </div>
            <span className="text-[11px] tabular-nums text-zinc-400 w-8 text-right shrink-0">
              {Number(c.count).toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── 도시 지도 상수 ──────────────────────────────────────────────────────────────

const SEOUL_GU_SET = new Set([
  "Gangnam-gu","Gangdong-gu","Gangbuk-gu","Gangseo-gu","Gwanak-gu",
  "Gwangjin-gu","Guro-gu","Geumcheon-gu","Nowon-gu","Dobong-gu",
  "Dongdaemun-gu","Dongjak-gu","Mapo-gu","Seodaemun-gu","Seocho-gu",
  "Seongdong-gu","Seongbuk-gu","Songpa-gu","Yangcheon-gu","Yeongdeungpo-gu",
  "Yongsan-gu","Eunpyeong-gu","Jongno-gu","Jung-gu","Jungnang-gu",
]);

const CITY_COUNTRY_MAP: Record<string, string> = {
  Seoul:"KR", Busan:"KR", Incheon:"KR", Daegu:"KR", Daejeon:"KR",
  Gwangju:"KR", Ulsan:"KR", Suwon:"KR", Seongnam:"KR", Goyang:"KR",
  Yongin:"KR", Changwon:"KR", Cheongju:"KR", Jeonju:"KR", Ansan:"KR",
  Bucheon:"KR", Cheonan:"KR", Anyang:"KR", Pohang:"KR", Jeju:"KR",
  Uijeongbu:"KR", Gimhae:"KR", Namyangju:"KR", Hwaseong:"KR",
  Pyeongtaek:"KR", Siheung:"KR", Gimpo:"KR", Hanam:"KR", Paju:"KR",
  Asan:"KR", Gimcheon:"KR", Iksan:"KR", Gyeongju:"KR", Gumi:"KR",
  Wonju:"KR", Chuncheon:"KR", Mokpo:"KR", Jinju:"KR", Andong:"KR",
  "Gangnam-gu":"KR","Gangdong-gu":"KR","Gangbuk-gu":"KR","Gangseo-gu":"KR",
  "Gwanak-gu":"KR","Gwangjin-gu":"KR","Guro-gu":"KR","Geumcheon-gu":"KR",
  "Nowon-gu":"KR","Dobong-gu":"KR","Dongdaemun-gu":"KR","Dongjak-gu":"KR",
  "Mapo-gu":"KR","Seodaemun-gu":"KR","Seocho-gu":"KR","Seongdong-gu":"KR",
  "Seongbuk-gu":"KR","Songpa-gu":"KR","Yangcheon-gu":"KR","Yeongdeungpo-gu":"KR",
  "Yongsan-gu":"KR","Eunpyeong-gu":"KR","Jongno-gu":"KR","Jung-gu":"KR","Jungnang-gu":"KR",
  Tokyo:"JP", Osaka:"JP", Yokohama:"JP", Nagoya:"JP", Sapporo:"JP",
  Fukuoka:"JP", Kobe:"JP", Kyoto:"JP", Hiroshima:"JP",
  "New York":"US", "Los Angeles":"US", Chicago:"US", Houston:"US",
  Phoenix:"US", Philadelphia:"US", "San Antonio":"US", "San Diego":"US",
  Dallas:"US", "San Jose":"US", Austin:"US", Seattle:"US",
  "San Francisco":"US", Denver:"US", Boston:"US", Atlanta:"US",
  Miami:"US", Portland:"US", "Las Vegas":"US", Detroit:"US",
  Nashville:"US", Minneapolis:"US", Charlotte:"US",
  London:"GB", Paris:"FR", Berlin:"DE", Madrid:"ES", Rome:"IT",
  Amsterdam:"NL", Vienna:"AT", Brussels:"BE", Stockholm:"SE",
  Copenhagen:"DK", Zurich:"CH", Munich:"DE", Milan:"IT",
  Barcelona:"ES", Warsaw:"PL", Prague:"CZ", Helsinki:"FI",
  Oslo:"NO", Dublin:"IE", Lisbon:"PT", Budapest:"HU", Bucharest:"RO", Hamburg:"DE",
  Beijing:"CN", Shanghai:"CN", Guangzhou:"CN", Shenzhen:"CN",
  Chengdu:"CN", Hangzhou:"CN", Wuhan:"CN", Nanjing:"CN",
};

const COUNTRY_NAMES: Record<string, string> = {
  KR:"한국", US:"미국", JP:"일본", CN:"중국",
  GB:"영국", FR:"프랑스", DE:"독일", ES:"스페인",
  SG:"싱가포르", TW:"대만", AU:"호주", CA:"캐나다",
};

const GEO_URLS = {
  KR: "/geo/korea-provinces.json",
  SEOUL: "/geo/seoul-gu.json",
  US: "/geo/us-states.json",
  JP: "/geo/japan.json",
  WORLD: "/geo/world.json",
} as const;

const CITY_KR: Record<string, string> = {
  Seoul:"서울", Incheon:"인천", Suwon:"수원", Seongnam:"성남", Goyang:"고양",
  Yongin:"용인", Ansan:"안산", Bucheon:"부천", Anyang:"안양", Namyangju:"남양주",
  Hwaseong:"화성", Siheung:"시흥", Gimpo:"김포", Hanam:"하남", Paju:"파주",
  Uijeongbu:"의정부", Pyeongtaek:"평택", Changwon:"창원", Cheongju:"청주",
  Jeonju:"전주", Cheonan:"천안", Pohang:"포항", Jeju:"제주", Gimhae:"김해",
  Gumi:"구미", Busan:"부산", Daegu:"대구", Daejeon:"대전", Gwangju:"광주", Ulsan:"울산",
  "Gangnam-gu":"강남구","Gangdong-gu":"강동구","Gangbuk-gu":"강북구","Gangseo-gu":"강서구",
  "Gwanak-gu":"관악구","Gwangjin-gu":"광진구","Guro-gu":"구로구","Geumcheon-gu":"금천구",
  "Nowon-gu":"노원구","Dobong-gu":"도봉구","Dongdaemun-gu":"동대문구","Dongjak-gu":"동작구",
  "Mapo-gu":"마포구","Seodaemun-gu":"서대문구","Seocho-gu":"서초구","Seongdong-gu":"성동구",
  "Seongbuk-gu":"성북구","Songpa-gu":"송파구","Yangcheon-gu":"양천구","Yeongdeungpo-gu":"영등포구",
  "Yongsan-gu":"용산구","Eunpyeong-gu":"은평구","Jongno-gu":"종로구","Jung-gu":"중구","Jungnang-gu":"중랑구",
};

// 도시 → 한국 시/도 (name_eng 기준)
const CITY_TO_KR_PROVINCE: Record<string, string> = {
  Seoul:"Seoul", Busan:"Busan", Daegu:"Daegu", Incheon:"Incheon",
  Gwangju:"Gwangju", Daejeon:"Daejeon", Ulsan:"Ulsan",
  Suwon:"Gyeonggi-do", Seongnam:"Gyeonggi-do", Goyang:"Gyeonggi-do",
  Yongin:"Gyeonggi-do", Ansan:"Gyeonggi-do", Bucheon:"Gyeonggi-do",
  Anyang:"Gyeonggi-do", Namyangju:"Gyeonggi-do", Hwaseong:"Gyeonggi-do",
  Siheung:"Gyeonggi-do", Gimpo:"Gyeonggi-do", Hanam:"Gyeonggi-do",
  Paju:"Gyeonggi-do", Uijeongbu:"Gyeonggi-do", Pyeongtaek:"Gyeonggi-do",
  Chuncheon:"Gangwon-do", Wonju:"Gangwon-do",
  Cheongju:"Chungcheongbuk-do",
  Cheonan:"Chungcheongnam-do", Asan:"Chungcheongnam-do",
  Jeonju:"Jeollabuk-do", Iksan:"Jeollabuk-do",
  Mokpo:"Jeollanam-do",
  Pohang:"Gyeongsangbuk-do", Gyeongju:"Gyeongsangbuk-do",
  Gimcheon:"Gyeongsangbuk-do", Gumi:"Gyeongsangbuk-do", Andong:"Gyeongsangbuk-do",
  Changwon:"Gyeongsangnam-do", Gimhae:"Gyeongsangnam-do", Jinju:"Gyeongsangnam-do",
  Jeju:"Jeju-do",
};

// 도시 → 미국 주 (state name 기준)
const CITY_TO_US_STATE: Record<string, string> = {
  "New York":"New York",
  "Los Angeles":"California", "San Francisco":"California",
  "San Diego":"California", "San Jose":"California",
  Chicago:"Illinois",
  Houston:"Texas", "San Antonio":"Texas", Dallas:"Texas", Austin:"Texas",
  Phoenix:"Arizona", Philadelphia:"Pennsylvania",
  Seattle:"Washington", Portland:"Oregon", Denver:"Colorado",
  Boston:"Massachusetts", Atlanta:"Georgia", Miami:"Florida",
  "Las Vegas":"Nevada", Detroit:"Michigan", Nashville:"Tennessee",
  Minneapolis:"Minnesota", Charlotte:"North Carolina",
};

// 서울 구 → Seoul 집계
function aggregateSeoulGu(cities: SiteData["cities"]): { city: string | null; count: number }[] {
  let guTotal = 0;
  const others: { city: string | null; count: number }[] = [];
  cities.forEach((c) => {
    const n = decodeCity(c.city);
    if (n && SEOUL_GU_SET.has(n)) guTotal += Number(c.count);
    else others.push({ city: c.city, count: Number(c.count) });
  });
  if (guTotal > 0) {
    const idx = others.findIndex((c) => decodeCity(c.city) === "Seoul");
    if (idx >= 0) others[idx] = { city: "Seoul", count: Number(others[idx].count) + guTotal };
    else others.push({ city: "Seoul", count: guTotal });
  }
  return others;
}

// 도시 dot (choropleth 없는 지도용)
function CityDots({ cities, country, projection, accent }: {
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

// ─── 한국 시/도 choropleth ────────────────────────────────────────────────────

function KoreaMap({ cities, accent }: { cities: SiteData["cities"]; accent: string }) {
  const geo = useGeo(GEO_URLS.KR);
  const W = 300, H = 400;

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

  const { projection, features } = useMemo(() => {
    if (!geo) return { projection: geoMercator(), features: [] };
    const proj = geoMercator().fitExtent([[12, 12], [W - 12, H - 12]], geo);
    const gen = geoPath(proj);
    const feats = geo.features.map((f, i) => {
      const props = f.properties as { name: string; name_eng: string };
      const count = provinceCounts[props.name_eng] ?? 0;
      const centroid = gen.centroid(f as GeoPermissibleObjects);
      return { d: gen(f as GeoPermissibleObjects) ?? "", props, count, centroid, key: i };
    });
    return { projection: proj, features: feats };
  }, [geo, provinceCounts]);

  const maxCount = Math.max(...features.map((f) => f.count), 1);

  if (!geo) return <div className="h-64 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />;

  return (
    <ZoomableSVG vw={W} vh={H} className="w-full max-h-72" style={{ background: "#f4f4f5" }}>
      {features.map(({ d, count, props, centroid, key }) => {
        const t = count / maxCount;
        const hasData = count > 0;
        return (
          <g key={key}>
            <path d={d}
              fill={hasData ? accent : "#e4e4e7"}
              fillOpacity={hasData ? 0.15 + t * 0.78 : 1}
              stroke="white" strokeWidth="0.7"
              vectorEffect="non-scaling-stroke" />
            {centroid && !isNaN(centroid[0]) && hasData && (
              <text x={centroid[0].toFixed(1)} y={centroid[1].toFixed(1)}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="6.5" fontWeight="600" fontFamily="inherit"
                fill={t > 0.55 ? "white" : accent}
                stroke={t > 0.55 ? "transparent" : "white"}
                strokeWidth="2" paintOrder="stroke"
                style={{ pointerEvents: "none" }}>
                {props.name}
              </text>
            )}
          </g>
        );
      })}
    </ZoomableSVG>
  );
}

// ─── 서울 구 choropleth ───────────────────────────────────────────────────────

function SeoulGuMap({ cities, accent }: { cities: SiteData["cities"]; accent: string }) {
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
            <path d={d}
              fill={hasData ? accent : "#e2e2e6"}
              fillOpacity={hasData ? 0.18 + t * 0.72 : 1}
              stroke="white" strokeWidth="0.8"
              vectorEffect="non-scaling-stroke" />
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

// ─── 미국 주 choropleth ───────────────────────────────────────────────────────

function USMap({ cities, accent }: { cities: SiteData["cities"]; accent: string }) {
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

  const { projection, features } = useMemo(() => {
    if (!geo) return { projection: geoMercator(), features: [] };
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
      return { d: gen(f as GeoPermissibleObjects) ?? "", name: props.name, count, key: i };
    });
    return { projection: proj, features: feats };
  }, [geo, stateCounts]);

  const maxCount = Math.max(...features.map((f) => f.count), 1);

  if (!geo) return <div className="h-44 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />;

  return (
    <ZoomableSVG vw={W} vh={H} className="w-full" style={{ background: "#f4f4f5" }}>
      {features.map(({ d, count, key }) => {
        const t = count / maxCount;
        return (
          <path key={key} d={d}
            fill={count > 0 ? accent : "#e4e4e7"}
            fillOpacity={count > 0 ? 0.15 + t * 0.78 : 1}
            stroke="white" strokeWidth="0.5"
            vectorEffect="non-scaling-stroke" />
        );
      })}
      <CityDots cities={cities} country="US" projection={projection} accent={accent} />
    </ZoomableSVG>
  );
}

// ─── 일본/기타 국가 지도 ──────────────────────────────────────────────────────

function CountryMap({ cities, country, accent }: {
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

// ─── 도시 맵 섹션 ─────────────────────────────────────────────────────────────

type MapTab = { id: string; label: string };

function CityMapSection({ cities, countries }: { cities: SiteData["cities"]; countries: SiteData["countries"] }) {
  const { accent } = useAccent();

  const tabs = useMemo<MapTab[]>(() => {
    const countryCount: Record<string, number> = {};
    cities.forEach((c) => {
      const n = decodeCity(c.city);
      if (n && CITY_COUNTRY_MAP[n]) {
        const cc = CITY_COUNTRY_MAP[n];
        countryCount[cc] = (countryCount[cc] ?? 0) + Number(c.count);
      }
    });
    const hasSeoulDetail = cities.some((c) => {
      const n = decodeCity(c.city);
      return n === "Seoul" || SEOUL_GU_SET.has(n ?? "");
    });
    const result: MapTab[] = [];
    if (countryCount["KR"]) {
      result.push({ id: "KR", label: "🇰🇷 한국" });
      if (hasSeoulDetail) result.push({ id: "SEOUL", label: "서울" });
    }
    Object.entries(countryCount)
      .filter(([cc]) => cc !== "KR")
      .sort(([, a], [, b]) => b - a)
      .forEach(([cc]) => {
        result.push({ id: cc, label: `${countryFlag(cc)} ${COUNTRY_NAMES[cc] ?? cc}` });
      });
    return result;
  }, [cities]);

  const [selected, setSelected] = useState<string>(() => tabs[0]?.id ?? "KR");

  if (!tabs.length) return <p className="text-xs text-zinc-400 text-center py-4">도시 데이터가 없어요</p>;

  return (
    <div>
      {tabs.length > 1 && (
        <div className="flex gap-1 mb-3 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id}
              onClick={() => setSelected(tab.id)}
              className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                selected === tab.id ? "text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              }`}
              style={selected === tab.id ? { backgroundColor: accent } : undefined}>
              {tab.label}
            </button>
          ))}
        </div>
      )}
      {selected === "KR"    && <KoreaMap   cities={cities} accent={accent} />}
      {selected === "SEOUL" && <SeoulGuMap cities={cities} accent={accent} />}
      {selected === "US"    && <USMap      cities={cities} accent={accent} />}
      {selected !== "KR" && selected !== "SEOUL" && selected !== "US" && (
        <CountryMap cities={cities} country={selected} accent={accent} />
      )}
    </div>
  );
}

// ─── 시간대 영역 그래프 ───────────────────────────────────────────────────────

function HourlyAreaChart({ hourly }: { hourly: SiteData["hourly"] }) {
  const { accent } = useAccent();
  if (!hourly.length) return null;

  const hourMap = new Map(hourly.map((h) => [h.hour, Number(h.count)]));
  const counts = Array.from({ length: 24 }, (_, i) => hourMap.get(i) ?? 0);
  const max = Math.max(...counts, 1);

  const W = 300, H = 64, PAD_TOP = 6, PAD_BOTTOM = 16;
  const CHART_H = H - PAD_TOP - PAD_BOTTOM;
  const baseY = PAD_TOP + CHART_H;

  function xOf(i: number) { return (i / 23) * W; }
  function yOf(v: number) { return PAD_TOP + CHART_H - (v / max) * CHART_H; }

  const pts = counts.map((v, i) => ({ x: xOf(i), y: yOf(v) }));
  let linePath = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1], curr = pts[i];
    const cpx = (prev.x + curr.x) / 2;
    linePath += ` C ${cpx.toFixed(1)} ${prev.y.toFixed(1)} ${cpx.toFixed(1)} ${curr.y.toFixed(1)} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }
  const areaPath = `${linePath} L ${W} ${baseY} L 0 ${baseY} Z`;
  const peakHours = [...counts.map((v, i) => ({ h: i, v }))].sort((a, b) => b.v - a.v).slice(0, 2).filter((p) => p.v > 0);
  const gradId = `hag${accent.replace(/[^a-f0-9]/gi, "")}`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: "visible" }} aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={accent} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
      {peakHours.map(({ h, v }) => {
        const x = xOf(h), y = yOf(v);
        const label = h === 0 ? "자정" : h === 12 ? "정오" : h < 12 ? `오전 ${h}시` : `오후 ${h - 12}시`;
        const anchor = x < 30 ? "start" : x > W - 30 ? "end" : "middle";
        return (
          <g key={h}>
            <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r="3" fill={accent} />
            <text x={x.toFixed(1)} y={(y - 6).toFixed(1)} textAnchor={anchor}
              fontSize="8.5" fill={accent} fontWeight="600" fontFamily="inherit">{label}</text>
          </g>
        );
      })}
      {[0, 6, 12, 18, 23].map((h) => (
        <text key={h} x={xOf(h).toFixed(1)} y={H}
          textAnchor={h === 0 ? "start" : h === 23 ? "end" : "middle"}
          fontSize="9" fill="#a1a1aa" fontFamily="inherit">{h}시</text>
      ))}
    </svg>
  );
}

// ─── 디바이스 ─────────────────────────────────────────────────────────────────

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  mobile: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12" y2="18" strokeWidth="3" /></svg>,
  desktop: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>,
  tablet: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" /><line x1="12" y1="18" x2="12" y2="18" strokeWidth="3" /></svg>,
};
const DEVICE_COLORS = ["#f97316", "#8b5cf6", "#06b6d4", "#10b981", "#a1a1aa"];

function DeviceBar({ devices }: { devices: SiteData["devices"] }) {
  if (!devices.length) return null;
  const total = devices.reduce((s, d) => s + Number(d.count), 0);
  if (!total) return null;
  return (
    <div className="space-y-2">
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        {devices.map((d, i) => (
          <div key={d.device ?? i}
            style={{ width: `${(Number(d.count) / total) * 100}%`, backgroundColor: DEVICE_COLORS[i] }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {devices.map((d, i) => {
          const pct = Math.round((Number(d.count) / total) * 100);
          const name = d.device ?? "기타";
          return (
            <div key={name} className="flex items-center gap-1.5">
              <span style={{ color: DEVICE_COLORS[i] }}>{DEVICE_ICONS[name] ?? DEVICE_ICONS.desktop}</span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 capitalize">{name}</span>
              <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 유입 경로 ────────────────────────────────────────────────────────────────

function RefererList({ referers }: { referers: SiteData["referers"] }) {
  const { accent } = useAccent();
  if (!referers.length) return null;
  const max = Math.max(...referers.map((r) => Number(r.count)));
  return (
    <div className="space-y-2">
      {referers.slice(0, 4).map((r, i) => {
        const label = !r.referer ? "직접 접속" : r.referer === "/" ? "/" : r.referer;
        const pct = (Number(r.count) / max) * 100;
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 flex-1 truncate min-w-0">{label}</span>
            <div className="w-20 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accent, opacity: 0.6 }} />
            </div>
            <span className="text-[11px] tabular-nums text-zinc-400 w-6 text-right shrink-0">{Number(r.count)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────

export function OverviewInsights({ data }: { data: SiteData }) {
  const hasCountries = data.countries.filter((c) => c.country).length > 0;
  const hasCities    = data.cities.length > 0;
  const hasHourly    = data.hourly.length > 0;
  const hasDevices   = data.devices.length > 0;
  const hasReferers  = data.referers.length > 0;

  if (!hasCountries && !hasCities && !hasHourly && !hasDevices) return null;

  const blocks = [
    { title: "국가",       content: <CountryBars countries={data.countries} />,                         show: hasCountries },
    { title: "도시",       content: <CityMapSection cities={data.cities} countries={data.countries} />, show: hasCities    },
    { title: "활성 시간대", content: <HourlyAreaChart hourly={data.hourly} />,                          show: hasHourly    },
    { title: "디바이스",   content: <DeviceBar devices={data.devices} />,                               show: hasDevices   },
    { title: "유입 경로",  content: <RefererList referers={data.referers} />,                           show: hasReferers  },
  ];

  const visible = blocks.filter((b) => b.show);
  return (
    <div>
      {visible.map((b, i) => (
        <div key={b.title}>
          <div className="py-4">
            <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mb-2.5">{b.title}</p>
            {b.content}
          </div>
          {i < visible.length - 1 && <hr className="border-zinc-100 dark:border-zinc-800" />}
        </div>
      ))}
    </div>
  );
}
