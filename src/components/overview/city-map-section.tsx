"use client";

import { useState, useMemo } from "react";
import { useAccent } from "@/lib/theme-context";
import { countryFlag } from "@/lib/format";
import type { SiteData } from "../dashboard-view";
import { decodeCity, SEOUL_GU_SET, CITY_COUNTRY_MAP } from "./geo-data";
import { KoreaMap, SeoulGuMap } from "./kr-maps";
import { USMap, CountryMap } from "./world-maps";

// ─── 국가 바 ──────────────────────────────────────────────────────────────────

export function CountryBars({ countries }: { countries: SiteData["countries"] }) {
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

// ─── 도시 맵 섹션 ─────────────────────────────────────────────────────────────

type MapTab = { id: string; label: string };

export function CityMapSection({ cities }: { cities: SiteData["cities"] }) {
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
    const FIXED_ORDER = ["SEOUL", "KR", "US"];
    const result: MapTab[] = [];

    for (const id of FIXED_ORDER) {
      if (id === "SEOUL") {
        if (hasSeoulDetail) result.push({ id: "SEOUL", label: "SEOUL" });
      } else if (countryCount[id]) {
        result.push({ id, label: id });
      }
    }

    Object.entries(countryCount)
      .filter(([cc]) => !FIXED_ORDER.includes(cc))
      .sort(([, a], [, b]) => b - a)
      .forEach(([cc]) => {
        result.push({ id: cc, label: cc });
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
              {countryFlag(tab.id === "SEOUL" ? "KR" : tab.id)} {tab.label}
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
