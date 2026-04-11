"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { GoogleLoginButton } from "@/components/google-login-button";
import { SiteCard } from "@/components/site-card";
import { Divider, EmptyState } from "@m1kapp/ui";
import { BoostShop } from "@/components/boost-shop";
import type { RecentSite } from "@/lib/types";

function RegisterForm({
  bgColor,
  onRegistered,
}: {
  bgColor: string;
  onRegistered: () => void;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function isValidDomain(str: string): boolean {
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+([/][^\s]*)?$/.test(str);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const normalized = url.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");

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
        onRegistered();
        router.push(`/${data.slug}`);
      } else {
        setError(data.error || "등록에 실패했어요");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 space-y-2.5">
      <div className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-3 focus-within:border-zinc-400 transition-colors">
        <span className="text-zinc-300 text-sm shrink-0">https://</span>
        <input
          type="text"
          placeholder="blog.naver.com/dellose"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(""); }}
          className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none"
          required
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 px-1">{error}</p>
      )}
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

export function MyTab({
  sites,
  isSignedIn,
  bgColor,
  onRegistered,
}: {
  sites: RecentSite[];
  isSignedIn: boolean;
  bgColor: string;
  onRegistered: () => void;
}) {
  const { user } = useUser();
  const { signOut } = useClerk();

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-600 mb-1">나의 도전을 시작해보세요</p>
        <p className="text-xs text-zinc-400 mb-5">로그인하면 사이트를 등록하고 관리할 수 있어요</p>
        <GoogleLoginButton
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
          style={{ backgroundColor: bgColor }}
        />
      </div>
    );
  }

  const totalHits = sites.reduce((sum, s) => sum + Number(s.total), 0);
  const [pointBalance, setPointBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/points")
      .then((r) => r.json())
      .then((d) => setPointBalance(d.balance ?? null))
      .catch(() => {});
  }, []);

  const refreshBalance = () => {
    fetch("/api/points")
      .then((r) => r.json())
      .then((d) => setPointBalance(d.balance ?? null))
      .catch(() => {});
  };

  return (
    <div className="px-4 py-5">
      {/* 프로필 */}
      <div className="flex items-center gap-3 mb-6 justify-between">
        <div className="flex items-center gap-3">
        {user?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.imageUrl} alt="" className="w-12 h-12 rounded-full" />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: bgColor }}
          >
            <span className="text-lg font-black text-white">
              {(user?.firstName || "?").slice(0, 1)}
            </span>
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold text-zinc-900">
            {user?.firstName || user?.username || "나"}의 도전
          </h2>
          <p className="text-xs text-zinc-400">
            {sites.length}개 사이트 · 총 {totalHits.toLocaleString()}명 방문
            {pointBalance !== null && (
              <span className="ml-1.5">· 🚀 <span className="font-semibold text-zinc-600 dark:text-zinc-300">{pointBalance.toLocaleString()}</span></span>
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

      <RegisterForm bgColor={bgColor} onRegistered={onRegistered} />

      <Divider />

      {sites.length > 0 ? (
        <div className="space-y-2">
          {sites.map((site) => (
            <SiteCard
              key={site.slug}
              slug={site.slug}
              title={site.title}
              ogTitle={site.ogTitle}
              ogDescription={site.ogDescription}
              ogImage={site.ogImage}
            />
          ))}
        </div>
      ) : (
        <EmptyState message="사이트를 등록하고 1K 도전을 시작해보세요" />
      )}

      <Divider />

      <BoostShop onPurchased={refreshBalance} />
    </div>
  );
}
