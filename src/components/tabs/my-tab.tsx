"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { SiteCard, SiteCardSkeleton } from "@/components/site-card";
import { Divider, EmptyState, InAppSheet } from "@m1kapp/kit";
import { BoostShop } from "@/components/boost-shop";
import { BoostHistorySheet } from "@/components/boost-history-sheet";
import type { RecentSite } from "@/lib/types";
import { Avatar } from "@/components/avatar";

type BoostedSite = {
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

function RegisterForm({
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

function BoostedSiteCard({ site }: { site: BoostedSite }) {
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

export function MyTab({
  sites,
  isSignedIn,
  bgColor,
  onRegistered,
  sitesLoading = false,
}: {
  sites: RecentSite[];
  isSignedIn: boolean;
  bgColor: string;
  onRegistered: () => void;
  sitesLoading?: boolean;
}) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [pointBalance, setPointBalance] = useState<number | null>(null);
  const [showBoostShop, setShowBoostShop] = useState(false);
  const [showRegisterSheet, setShowRegisterSheet] = useState(false);
  const [boostedSites, setBoostedSites] = useState<BoostedSite[]>([]);
  const [activeSection, setActiveSection] = useState<"mine" | "others">("mine");

  const fetchBalance = () => {
    fetch("/api/points")
      .then((r) => r.json())
      .then((d) => setPointBalance(d.balance ?? null))
      .catch(() => {});
  };

  const fetchBoostedSites = () => {
    fetch("/api/points/boosted-sites")
      .then((r) => r.json())
      .then((d) => setBoostedSites(d.sites ?? []))
      .catch(() => {});
  };

  useEffect(() => {
    if (!isSignedIn) return;
    fetchBalance();
    fetchBoostedSites();
  }, [isSignedIn]);

  useEffect(() => {
    const handler = () => { fetchBalance(); fetchBoostedSites(); };
    window.addEventListener("m1k:boost-completed", handler);
    return () => window.removeEventListener("m1k:boost-completed", handler);
  }, []);

  const refreshBalance = fetchBalance;

  const totalHits = sites.reduce((sum, s) => sum + Number(s.total), 0);

  const router = useRouter();

  useEffect(() => {
    if (!isSignedIn) router.replace("/sign-in?redirect=/my");
  }, [isSignedIn, router]);

  if (!isSignedIn) return null;

  return (
    <div className="relative min-h-full px-4 pt-2 pb-24">
      {/* 프로필 */}
      <div className="flex items-center gap-3 mb-5 justify-between">
        <div className="flex items-center gap-3">
          <Avatar imageUrl={user?.imageUrl} name={user?.firstName || user?.username || "?"} size={44} />
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              {user?.firstName || user?.username || "나"}
            </h2>
            {(() => {
              const handle = user?.username || user?.primaryEmailAddress?.emailAddress.split("@")[0];
              return handle ? (
                <a href={`/@${handle}`} className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                  @{handle}
                </a>
              ) : null;
            })()}
            <p className="text-xs text-zinc-400">
              {sites.length}개 사이트 · 총 {totalHits.toLocaleString()}명 방문
              {pointBalance !== null && (
                <span className="ml-1.5 inline-flex items-center gap-1.5">
                  · 🚀 <span className="font-semibold text-zinc-600 dark:text-zinc-300">{pointBalance.toLocaleString()}</span>
                  <button
                    onClick={() => setShowBoostShop(true)}
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

      {/* 섹션 탭 */}
      <div className="flex gap-1 mb-5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
        <button
          onClick={() => setActiveSection("mine")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeSection === "mine"
              ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          나의 도전
        </button>
        <button
          onClick={() => setActiveSection("others")}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            activeSection === "others"
              ? "bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white shadow-sm"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          내가 응원한 도전
          {boostedSites.length > 0 && (
            <span className="ml-1 text-[9px] opacity-60">{boostedSites.length}</span>
          )}
        </button>
      </div>

      {activeSection === "mine" ? (
        <>
          <Divider />
          {sitesLoading ? (
            <SiteCardSkeleton count={3} />
          ) : sites.length > 0 ? (
            <div className="space-y-0">
              {sites.map((site) => (
                <SiteCard key={site.slug} site={site} />
              ))}
            </div>
          ) : (
            <EmptyState message="사이트를 등록하고 1K 도전을 시작해보세요" />
          )}
        </>
      ) : (
        <>
          {boostedSites.length > 0 ? (
            <div className="space-y-2">
              {boostedSites.map((site) => (
                <BoostedSiteCard key={site.slug} site={site} />
              ))}
            </div>
          ) : (
            <EmptyState message="부스트를 보낸 사이트가 여기에 표시돼요" />
          )}
        </>
      )}

      {activeSection === "mine" && (
        <div className="absolute right-4 bottom-4 z-40">
          <button
            onClick={() => setShowRegisterSheet(true)}
            className="flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-lg shadow-black/20 active:scale-[0.98] transition-transform"
            style={{ backgroundColor: bgColor }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            사이트 등록
          </button>
        </div>
      )}

      <InAppSheet
        open={showRegisterSheet}
        onClose={() => setShowRegisterSheet(false)}
        className="rounded-t-2xl bg-white dark:bg-zinc-950 p-5 pb-8 shadow-2xl"
      >
        <div className="mb-4">
          <p className="text-sm font-bold text-zinc-900 dark:text-white">사이트 등록</p>
          <p className="text-[11px] text-zinc-400 mt-1">프로필에 연결할 사이트 주소를 입력하세요.</p>
        </div>
        <RegisterForm
          bgColor={bgColor}
          onRegistered={onRegistered}
          onClose={() => setShowRegisterSheet(false)}
        />
        <button
          onClick={() => {
            setShowRegisterSheet(false);
            router.push("/connect");
          }}
          className="mt-3 w-full text-center text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
        >
          ✨ AI(클로드)로 한 번에 연결하기 →
        </button>
      </InAppSheet>

      <InAppSheet
        open={showBoostShop}
        onClose={() => setShowBoostShop(false)}
        className="rounded-t-2xl bg-white dark:bg-zinc-950 p-5 pb-8 shadow-2xl"
      >
        <div className="mb-4">
          <span className="text-sm font-bold text-zinc-900 dark:text-white">부스트 충전</span>
        </div>
        <BoostShop onPurchased={() => { refreshBalance(); setShowBoostShop(false); }} />
      </InAppSheet>
    </div>
  );
}
