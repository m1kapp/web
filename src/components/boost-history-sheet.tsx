"use client";

import { SitePreviewCard } from "./site-preview-card";

export type BoostLog = { amount: number; createdAt: string | null };

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
  total: number;
  logs: BoostLog[];
  loading?: boolean;
}

function formatLogDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function BoostHistorySheet({ open, onClose, site, total, logs, loading }: BoostHistorySheetProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-zinc-950 rounded-t-2xl flex flex-col"
        style={{ minHeight: "50vh", maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <span className="text-sm font-bold text-zinc-900 dark:text-white">나의 응원 내역</span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-xs"
          >
            ✕
          </button>
        </div>

        {/* 사이트 프리뷰 */}
        <div className="mx-5 mb-4">
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

        {/* 로그 목록 */}
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {loading ? (
            <p className="text-xs text-zinc-400 text-center py-6">불러오는 중...</p>
          ) : logs.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-6">내역이 없어요</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                <span className="text-xs text-zinc-400">
                  {log.createdAt ? formatLogDate(log.createdAt) : "-"}
                </span>
                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                  🚀 +{log.amount.toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
