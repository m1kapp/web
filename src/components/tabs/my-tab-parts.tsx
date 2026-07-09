"use client";

import { useState } from "react";
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
