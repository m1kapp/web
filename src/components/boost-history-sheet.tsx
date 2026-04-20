"use client";

import { useState, useEffect, useMemo } from "react";
import { formatLogDate } from "@/lib/format";
import { SitePreviewCard } from "./site-preview-card";

interface FeedLog {
  amount: number;
  createdAt: string | null;
  memo: string | null;
  user: { name: string; imageUrl: string | null };
}

interface BoostHistorySheetProps {
  open: boolean;
  onClose: () => void;
  site: {
    slug: string;
    name: string;
    ogImage?: string | null;
    color?: string | null;
    description?: string | null;
  };
  onBoost?: () => void;
}

type Sort = "latest" | "boost";

export function BoostHistorySheet({ open, onClose, site, onBoost }: BoostHistorySheetProps) {
  const [feed, setFeed] = useState<FeedLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<Sort>("latest");

  const total = useMemo(() => feed.reduce((sum, l) => sum + l.amount, 0), [feed]);
  const sorted = useMemo(
    () => sort === "boost" ? [...feed].sort((a, b) => b.amount - a.amount) : feed,
    [feed, sort]
  );

  useEffect(() => {
    if (!open) { setFeed([]); return; }
    setLoading(true);
    fetch(`/api/sites/boosts?slug=${encodeURIComponent(site.slug)}`)
      .then((r) => r.json())
      .then((d) => setFeed(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, site.slug]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-zinc-950 rounded-t-2xl flex flex-col"
        style={{ height: "100dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <span className="text-sm font-bold text-zinc-900 dark:text-white">응원 피드</span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-xs"
          >
            ✕
          </button>
        </div>

        <div className="mx-5 mb-4 shrink-0">
          <SitePreviewCard
            slug={site.slug}
            name={site.name}
            ogImage={site.ogImage}
            color={site.color}
            description={site.description}
            right={
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                🚀 {total.toLocaleString()}
              </span>
            }
          />
        </div>

        <div className="flex-1 overflow-y-auto pb-8">
          {feed.length > 0 && (
            <div className="flex items-center justify-between px-5 pb-2">
              <button
                onClick={() => { onClose(); onBoost?.(); }}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 transition-colors"
              >
                🚀 부스트 보내기
              </button>
              <div className="flex">
                {(["latest", "boost"] as Sort[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                      sort === s
                        ? "text-zinc-900 dark:text-white bg-zinc-100 dark:bg-zinc-800"
                        : "text-zinc-400 dark:text-zinc-600"
                    }`}
                  >
                    {s === "latest" ? "최신순" : "부스트순"}
                  </button>
                ))}
              </div>
            </div>
          )}
          {loading ? (
            <p className="text-xs text-zinc-400 text-center py-6">불러오는 중...</p>
          ) : feed.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-6">아직 응원이 없어요</p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {sorted.map((log, i) => (
                <div key={i} className="flex gap-3 px-5 py-3.5">
                  <div className="shrink-0">
                    {log.user.imageUrl ? (
                      <img src={log.user.imageUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-500">
                        {log.user.name[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate">
                        {log.user.name}
                      </span>
                      <span className="text-[10px] text-zinc-400 shrink-0">
                        {log.createdAt ? formatLogDate(log.createdAt) : ""}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-snug">
                      {log.memo ?? <span className="text-zinc-400 dark:text-zinc-500 italic">Boost!!!</span>}
                    </p>
                    <span className="text-[11px] font-bold text-zinc-400 tabular-nums mt-0.5 inline-block">
                      🚀 +{log.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
