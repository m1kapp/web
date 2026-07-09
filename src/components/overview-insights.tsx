"use client";

import type { SiteData } from "./dashboard-view";
import { CountryBars, CityMapSection } from "./overview/city-map-section";
import { HourlyAreaChart, DeviceBar, BrowserOsBar, RefererList } from "./overview/usage-charts";

export { CoachSection } from "./overview/coach";

// ─── 메인 ─────────────────────────────────────────────────────────────────────

export function OverviewInsights({ data }: { data: SiteData }) {
  const hasCountries  = data.countries.filter((c) => c.country).length > 0;
  const hasCities     = data.cities.length > 0;
  const hasHourly     = data.hourly.length > 0;
  const hasDevices    = data.devices.length > 0;
  const hasBrowsersOs = data.browsers.filter((b) => b.browser).length > 0 || data.os.filter((o) => o.os).length > 0;
  const hasReferers   = data.referers.length > 0;

  if (!hasCountries && !hasCities && !hasHourly && !hasDevices) return null;

  const blocks = [
    { id: "sec-country",  title: "국가",         content: <CountryBars countries={data.countries} />,              show: hasCountries  },
    { id: "sec-city",     title: "도시",         content: <CityMapSection cities={data.cities} />,                 show: hasCities     },
    { id: "sec-hourly",   title: "활성 시간대",  content: <HourlyAreaChart hourly={data.hourly} />,                show: hasHourly     },
    { id: "sec-device",   title: "디바이스",     content: <DeviceBar devices={data.devices} />,                    show: hasDevices    },
    { id: "sec-browser",  title: "브라우저 · OS", content: <BrowserOsBar browsers={data.browsers} os={data.os} />, show: hasBrowsersOs },
    { id: "sec-referer",  title: "유입 경로",    content: <RefererList referers={data.referers} />,                show: hasReferers   },
  ];

  const visible = blocks.filter((b) => b.show);
  return (
    <div>
      {visible.map((b, i) => (
        <div key={b.title} id={b.id}>
          <div className="py-5">
            <p className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 mb-2.5">{b.title}</p>
            {b.content}
          </div>
          {i < visible.length - 1 && <hr className="border-zinc-100 dark:border-zinc-800" />}
        </div>
      ))}
    </div>
  );
}
