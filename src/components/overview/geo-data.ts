import type { SiteData } from "../dashboard-view";

// ─── 도시 좌표 테이블 ─────────────────────────────────────────────────────────

export const CITY_COORDS: Record<string, [number, number]> = {
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

export function decodeCity(city: string | null): string | null {
  if (!city) return null;
  try { return decodeURIComponent(city); } catch { return city; }
}

// ─── 도시 지도 상수 ──────────────────────────────────────────────────────────────

export const SEOUL_GU_SET = new Set([
  "Gangnam-gu","Gangdong-gu","Gangbuk-gu","Gangseo-gu","Gwanak-gu",
  "Gwangjin-gu","Guro-gu","Geumcheon-gu","Nowon-gu","Dobong-gu",
  "Dongdaemun-gu","Dongjak-gu","Mapo-gu","Seodaemun-gu","Seocho-gu",
  "Seongdong-gu","Seongbuk-gu","Songpa-gu","Yangcheon-gu","Yeongdeungpo-gu",
  "Yongsan-gu","Eunpyeong-gu","Jongno-gu","Jung-gu","Jungnang-gu",
]);

export const CITY_COUNTRY_MAP: Record<string, string> = {
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

export const COUNTRY_NAMES: Record<string, string> = {
  KR:"한국", US:"미국", JP:"일본", CN:"중국",
  GB:"영국", FR:"프랑스", DE:"독일", ES:"스페인",
  SG:"싱가포르", TW:"대만", AU:"호주", CA:"캐나다",
};

export const GEO_URLS = {
  KR: "/geo/korea-provinces.json",
  SEOUL: "/geo/seoul-gu.json",
  US: "/geo/us-states.json",
  JP: "/geo/japan.json",
  WORLD: "/geo/world.json",
} as const;

export const CITY_KR: Record<string, string> = {
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
export const CITY_TO_KR_PROVINCE: Record<string, string> = {
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
export const CITY_TO_US_STATE: Record<string, string> = {
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
export function aggregateSeoulGu(cities: SiteData["cities"]): { city: string | null; count: number }[] {
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
