"use client";

import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Avatar } from "@/components/avatar";
import { useRouter } from "next/navigation";
import { SiteCard } from "@/components/site-card";
import { BoostHistorySheet } from "@/components/boost-history-sheet";
import type { RecentSite } from "@/lib/types";

export type BoostedSite = {
  slug: string;
  title: string | null;
  url: string | null;
  color: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  faviconUrl?: string | null;
  totalBoosted: number;
};

export function RegisterForm({
  bgColor,
  onRegistered,
  onClose,
}: {
  bgColor: string;
  onRegistered: () => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function isValidDomain(str: string): boolean {
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9-]{1,})*\.[a-zA-Z]{2,}([/][^\s]*)?$/.test(str);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const normalized = url
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/+$/, "");

    if (!normalized) {
      setError("URL을 입력해주세요");
      return;
    }

    if (!isValidDomain(normalized)) {
      setError("올바른 도메인을 입력해주세요 (예: blog.naver.com/dellose)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized }),
      });
      const data = await res.json();
      if (res.ok) {
        setUrl("");
        onRegistered();
        onClose();
        router.push(`/${data.slug}`);
      } else {
        setError(data.error || "등록에 실패했어요");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="rounded-xl border border-zinc-200 px-4 py-3 focus-within:border-zinc-400 transition-colors">
        <input
          type="text"
          placeholder="https://blog.naver.com/dellose"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(""); }}
          className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none"
          required
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 px-1">{error}</p>
      )}
      <p className="text-[11px] text-zinc-400 px-1">
        전체 URL을 붙여넣어도 되고, `https://` 는 자동으로 정리돼요.
      </p>
      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 active:scale-[0.98]"
        style={{ backgroundColor: bgColor }}
      >
        {loading ? "등록 중..." : "사이트 등록"}
      </button>
    </form>
  );
}

export function BoostedSiteCard({ site }: { site: BoostedSite }) {
  const [showSheet, setShowSheet] = useState(false);
  const name = site.ogTitle || site.title || site.url || site.slug;

  const chip = (
    <button
      onClick={(e) => { e.stopPropagation(); setShowSheet(true); }}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
    >
      나의 응원 🚀{Number(site.totalBoosted).toLocaleString()}
    </button>
  );

  const cardSite: RecentSite = {
    slug: site.slug,
    title: site.title,
    url: site.url,
    ogTitle: site.ogTitle,
    ogDescription: site.ogDescription,
    ogImage: site.ogImage,
    color: site.color,
    total: 0,
    owner: null,
  };

  return (
    <>
      <SiteCard site={cardSite} rightSlot={chip} />
      <BoostHistorySheet
        open={showSheet}
        onClose={() => setShowSheet(false)}
        site={{ slug: site.slug, name: name ?? site.slug, faviconUrl: site.faviconUrl, color: site.color, description: site.ogDescription }}
      />
    </>
  );
}

/** 프로필 카드 — 아바타·핸들·사이트/방문 요약·부스트 잔액·로그아웃 */
export function ProfileHeader({ sitesCount, totalHits, pointBalance, onOpenShop }: {
  sitesCount: number; totalHits: number; pointBalance: number | null; onOpenShop: () => void;
}) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const handle = user?.username || user?.primaryEmailAddress?.emailAddress.split("@")[0];

  return (
    <div className="flex items-center gap-3 mb-5 justify-between">
      <div className="flex items-center gap-3">
        <Avatar imageUrl={user?.imageUrl} name={user?.firstName || user?.username || "?"} size={44} />
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            {user?.firstName || user?.username || "나"}
          </h2>
          {handle && (
            <a href={`/@${handle}`} className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              @{handle}
            </a>
          )}
          <p className="text-xs text-zinc-400">
            {sitesCount}개 사이트 · 총 {totalHits.toLocaleString()}명 방문
            {pointBalance !== null && (
              <span className="ml-1.5 inline-flex items-center gap-1.5">
                · 🚀 <span className="font-semibold text-zinc-600 dark:text-zinc-300">{pointBalance.toLocaleString()}</span>
                <button
                  onClick={onOpenShop}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-[9px] font-bold leading-none border border-zinc-200 dark:border-zinc-700"
                >
                  충전
                </button>
              </span>
            )}
          </p>
        </div>
      </div>
      <button
        onClick={() => signOut()}
        className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors px-2 py-1"
      >
        로그아웃
      </button>
    </div>
  );
}
