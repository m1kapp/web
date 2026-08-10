"use client";

import { AppCard } from "@/components/app-card";
import type { RecentSite } from "@/lib/types";

/**
 * 새로 등록된 앱 — 앱스토어의 "새로운 앱" 자리.
 *
 * 리그 목록은 누적 방문 순이라 갓 등록한 사이트는 늘 맨 아래로 밀린다.
 * 방금 합류한 사람의 것을 한 번은 눈에 띄게 놓아주려는 섹션이다.
 */
export function NewArrivals({ sites, bgColor }: { sites: RecentSite[]; bgColor: string }) {
  // createdAt은 서버에선 Date, fetch를 거치면 string으로 온다 — 숫자로 눌러서 비교한다
  const time = (v: RecentSite["createdAt"]) => (v ? new Date(v).getTime() : 0);
  const newest = [...sites]
    .filter((s) => s.createdAt)
    .sort((a, b) => time(b.createdAt) - time(a.createdAt))
    .slice(0, 3);

  if (!newest.length) return null;

  return (
    <div className="space-y-2">
      {newest.map((site) => (
        <AppCard key={site.slug} site={site} bgColor={bgColor} showAge />
      ))}
    </div>
  );
}
