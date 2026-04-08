"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Show, UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { GoogleLoginButton } from "@/components/google-login-button";
import { Watermark } from "@/components/watermark";
import { SiteCard } from "@/components/site-card";
import { AppShell, SectionHeader, Divider, EmptyState, TabButton } from "@/components/ui-parts";

interface RecentSite {
  slug: string;
  title: string | null;
  url: string | null;
  total: number;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  color: string | null;
  owner: { name: string; imageUrl: string } | null;
}

const BG_COLORS = [
  "#ec4899", "#a855f7", "#3b82f6", "#22c55e", "#f97316", "#ef4444", "#0f172a", "#18181b",
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentSites, setRecentSites] = useState<RecentSite[]>([]);
  const [mySites, setMySites] = useState<RecentSite[]>([]);
  const [bgColor, setBgColor] = useState("#0f172a");
  const [tab, setTab] = useState<"home" | "store" | "badge" | "my">("home");
  const router = useRouter();
  const { isSignedIn } = useUser();

  useEffect(() => {
    fetch("/api/sites/recent")
      .then((res) => res.json())
      .then(setRecentSites)
      .catch(() => {});
  }, []);

  // 내 사이트 탭 열면 fetch
  useEffect(() => {
    if (tab === "my" && isSignedIn) {
      fetch("/api/sites/mine")
        .then((res) => res.json())
        .then((data) => Array.isArray(data) ? setMySites(data) : setMySites([]))
        .catch(() => {});
    }
  }, [tab, isSignedIn]);

  const [error, setError] = useState("");

  function normalizeUrl(input: string): string {
    return input.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  }

  function isValidDomain(str: string): boolean {
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+([/][^\s]*)?$/.test(str);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const normalized = normalizeUrl(url);

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
      if (res.ok) {
        router.push(`/${normalized}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Watermark color={bgColor}>
      <AppShell className="bg-white dark:bg-zinc-950">
        {/* 헤더 — 고정 */}
        <header className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between border-b border-zinc-100 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md">
          <span className="text-2xl font-black tracking-tighter" style={{ color: bgColor }}>
            m1k
          </span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {BG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setBgColor(c)}
                  className="w-4 h-4 rounded-full transition-all hover:scale-125"
                  style={{
                    backgroundColor: c,
                    boxShadow: bgColor === c ? `0 0 0 1.5px white, 0 0 0 3px ${c}` : "none",
                    border: bgColor !== c ? "1px solid rgba(0,0,0,0.06)" : "none",
                  }}
                />
              ))}
            </div>
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: { avatarBox: "w-7 h-7" },
                }}
              />
            </Show>
            <Show when="signed-out">
              <GoogleLoginButton
                className="text-[11px] font-semibold px-3 py-1 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition-colors flex items-center gap-1.5"
              />
            </Show>
          </div>
        </header>

        {/* 탭 콘텐츠 */}
        <div className="flex-1 overflow-y-auto">
          {tab === "home" ? (
            <HomeTab
              url={url}
              setUrl={(v) => { setUrl(v); setError(""); }}
              loading={loading}
              bgColor={bgColor}
              recentSites={recentSites}
              onSubmit={handleSubmit}
              error={error}
            />
          ) : tab === "store" ? (
            <StoreTab
              sites={recentSites}
              onRefreshItem={async (slug: string) => {
                await fetch("/api/sites/refresh-og", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ slug }),
                });
                const res = await fetch("/api/sites/recent");
                setRecentSites(await res.json());
              }}
            />
          ) : tab === "badge" ? (
            <BadgeWorldTab bgColor={bgColor} />
          ) : (
            <MyTab sites={mySites} isSignedIn={!!isSignedIn} bgColor={bgColor} />
          )}
        </div>

        {/* 하단 탭바 */}
        <nav className="sticky bottom-0 z-20 border-t border-zinc-200 dark:border-zinc-800 flex bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md">
          <TabButton
            active={tab === "home"}
            onClick={() => setTab("home")}
            activeColor={bgColor}
            label="홈"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={tab === "home" ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12l9-9 9 9" />
                <path d="M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10" />
              </svg>
            }
          />
          <TabButton
            active={tab === "store"}
            onClick={() => setTab("store")}
            activeColor={bgColor}
            label="탐색"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={tab === "store" ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            }
          />
          <TabButton
            active={tab === "badge"}
            onClick={() => setTab("badge")}
            activeColor={bgColor}
            label="배지 월드"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={tab === "badge" ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.77 4 4 0 0 1 0 6.76 4 4 0 0 1-4.78 4.77 4 4 0 0 1-6.74 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            }
          />
          <TabButton
            active={tab === "my"}
            onClick={() => setTab("my")}
            activeColor={bgColor}
            label="나의 도전"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={tab === "my" ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
          />
        </nav>
      </AppShell>
    </Watermark>
  );
}

function HomeTab({
  url,
  setUrl,
  loading,
  bgColor,
  recentSites,
  onSubmit,
  error,
}: {
  url: string;
  setUrl: (v: string) => void;
  loading: boolean;
  bgColor: string;
  recentSites: RecentSite[];
  onSubmit: (e: React.FormEvent) => void;
  error: string;
}) {
  return (
    <>
      {/* 히어로 */}
      <div className="px-4 pt-8 pb-6 text-center">
        <h1 className="text-5xl font-black tracking-tighter text-zinc-900 mb-1">
          m1k
        </h1>
        <p className="text-zinc-500 text-sm mb-6">
          나는 1K를 만들거야!
        </p>

        {/* 3스텝 온보딩 */}
        <div className="flex gap-3 mb-6">
          {[
            { step: "1", title: "주소 입력", desc: "사이트 URL만" },
            { step: "2", title: "배지 달기", desc: "코드 복사 붙여넣기" },
            { step: "3", title: "1K 달성", desc: "방문자 추적 시작" },
          ].map((s) => (
            <div key={s.step} className="flex-1 rounded-xl bg-zinc-50 py-3 px-2">
              <div
                className="w-6 h-6 rounded-full mx-auto mb-1.5 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: bgColor }}
              >
                {s.step}
              </div>
              <p className="text-[11px] font-semibold text-zinc-700">{s.title}</p>
              <p className="text-[9px] text-zinc-400">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* 입력 폼 */}
        <form onSubmit={onSubmit} className="space-y-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-3.5 focus-within:border-zinc-400 transition-colors">
            <span className="text-zinc-300 text-sm shrink-0">https://</span>
            <input
              type="text"
              placeholder="blog.naver.com/dellose"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
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
            className="w-full h-12 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 active:scale-[0.98]"
            style={{ backgroundColor: bgColor }}
          >
            {loading ? "시작하는 중..." : "시작하기"}
          </button>
        </form>
      </div>

      {/* 최근 등록 */}
      {recentSites.length > 0 && (
        <div className="px-4 pb-4">
          <Divider />
          <SectionHeader>최근 등록</SectionHeader>
          <div className="space-y-2">
            {recentSites.slice(0, 3).map((site) => (
              <SiteCard
                key={site.slug}
                slug={site.slug}
                title={site.title}
                ogTitle={site.ogTitle}
                ogDescription={site.ogDescription}
                ogImage={site.ogImage}
                color={site.color}
                owner={site.owner}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function StoreTab({ sites: initialSites, onRefreshItem }: { sites: RecentSite[]; onRefreshItem: (slug: string) => Promise<void> }) {
  const [refreshingSlug, setRefreshingSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "popular" | "name">("recent");
  const [filteredSites, setFilteredSites] = useState<RecentSite[]>(initialSites);
  const [searching, setSearching] = useState(false);

  // 검색/정렬 변경 시 API 호출
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (sort !== "recent") params.set("sort", sort);

    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/sites/recent?${params}`);
        setFilteredSites(await res.json());
      } catch {}
      setSearching(false);
    }, searchQuery ? 300 : 0); // 검색은 디바운스

    return () => clearTimeout(timeout);
  }, [searchQuery, sort]);

  // initialSites 변경 시 반영
  useEffect(() => {
    if (!searchQuery && sort === "recent") setFilteredSites(initialSites);
  }, [initialSites, searchQuery, sort]);

  const sites = filteredSites;

  return (
    <div className="px-4 py-5">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">탐색</h2>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">등록된 사이트를 둘러보세요</p>
      </div>

      {/* 검색 */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="사이트 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600"
        />
      </div>

      {/* 정렬 */}
      <div className="flex gap-1.5 mb-4">
        {([
          { value: "recent", label: "최신순" },
          { value: "popular", label: "인기순" },
          { value: "name", label: "이름순" },
        ] as const).map((s) => (
          <button
            key={s.value}
            onClick={() => setSort(s.value)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              sort === s.value
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
            }`}
          >
            {s.label}
          </button>
        ))}
        {searching && <span className="text-xs text-zinc-300 self-center ml-auto">검색 중...</span>}
      </div>

      {sites.length > 0 ? (
        <div className="space-y-3">
          {sites.map((site) => (
            <SiteCard
              key={site.slug}
              slug={site.slug}
              title={site.title}
              ogTitle={site.ogTitle}
              ogDescription={site.ogDescription}
              ogImage={site.ogImage}
              color={site.color}
              owner={site.owner}
              actions={
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setRefreshingSlug(site.slug);
                    await onRefreshItem(site.slug);
                    setRefreshingSlug(null);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors flex items-center gap-2"
                >
                  <svg
                    width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={refreshingSlug === site.slug ? "animate-spin" : ""}
                  >
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 16h5v5" />
                  </svg>
                  {refreshingSlug === site.slug ? "새로고침 중..." : "OG 새로고침"}
                </button>
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState message="아직 등록된 사이트가 없어요" />
      )}
    </div>
  );
}

function MyTab({
  sites,
  isSignedIn,
  bgColor,
}: {
  sites: RecentSite[];
  isSignedIn: boolean;
  bgColor: string;
}) {
  const { user } = useUser();

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

  return (
    <div className="px-4 py-5">
      {/* 프로필 */}
      <div className="flex items-center gap-3 mb-6">
        {user?.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.imageUrl}
            alt=""
            className="w-12 h-12 rounded-full"
          />
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
          </p>
        </div>
      </div>

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
        <EmptyState message="아직 등록한 사이트가 없어요" />
      )}
    </div>
  );
}

// ── 배지 월드 — 달성 뱃지 시스템 ──
const ACHIEVEMENT_BADGES = [
  {
    category: "누적 달성",
    desc: "전체 방문수 기준",
    items: [
      { icon: "🌱", name: "새싹", condition: "첫 방문자", threshold: 1 },
      { icon: "🐣", name: "병아리", condition: "누적 10명", threshold: 10 },
      { icon: "🔥", name: "불꽃", condition: "누적 50명", threshold: 50 },
      { icon: "⭐", name: "스타", condition: "누적 100명", threshold: 100 },
      { icon: "👑", name: "왕관", condition: "누적 250명", threshold: 250 },
      { icon: "💎", name: "다이아", condition: "누적 500명", threshold: 500 },
      { icon: "🏆", name: "트로피", condition: "누적 750명", threshold: 750 },
      { icon: "🚀", name: "로켓", condition: "1K 달성!", threshold: 1000 },
    ],
  },
  {
    category: "주간 달성",
    desc: "이번 주 방문수 기준",
    items: [
      { icon: "🐢", name: "거북이", condition: "주간 1명", threshold: 1 },
      { icon: "🐇", name: "토끼", condition: "주간 10명", threshold: 10 },
      { icon: "🦅", name: "독수리", condition: "주간 50명", threshold: 50 },
      { icon: "🐉", name: "용", condition: "주간 100명", threshold: 100 },
    ],
  },
  {
    category: "일간 달성",
    desc: "오늘 방문수 기준",
    items: [
      { icon: "☀️", name: "맑음", condition: "오늘 1명", threshold: 1 },
      { icon: "🌈", name: "무지개", condition: "오늘 10명", threshold: 10 },
      { icon: "⚡", name: "번개", condition: "오늘 50명", threshold: 50 },
      { icon: "🌋", name: "폭발", condition: "오늘 100명", threshold: 100 },
    ],
  },
  {
    category: "특별 배지",
    desc: "특수 조건 달성",
    items: [
      { icon: "🌍", name: "글로벌", condition: "3개국 이상 방문", threshold: 0 },
      { icon: "📱", name: "모바일 킹", condition: "모바일 방문 50% 이상", threshold: 0 },
      { icon: "🔗", name: "입소문", condition: "리퍼러 3곳 이상", threshold: 0 },
      { icon: "📅", name: "꾸준함", condition: "30일 연속 방문", threshold: 0 },
    ],
  },
];

function BadgeWorldTab({ bgColor }: { bgColor: string }) {
  return (
    <div className="px-4 py-5">
      <h2 className="text-lg font-bold text-zinc-900 mb-1">배지 월드</h2>
      <p className="text-xs text-zinc-400 mb-6">
        방문자가 늘어날수록 새로운 배지를 획득해요
      </p>

      <div className="space-y-6">
        {ACHIEVEMENT_BADGES.map((group) => (
          <div key={group.category}>
            <div className="mb-3">
              <h3
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: bgColor }}
              >
                {group.category}
              </h3>
              <p className="text-[10px] text-zinc-400">{group.desc}</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {group.items.map((badge) => (
                <div
                  key={badge.name}
                  className="flex flex-col items-center rounded-xl bg-zinc-50 py-3 px-1 group relative"
                >
                  <span className="text-2xl mb-1">{badge.icon}</span>
                  <p className="text-[10px] font-semibold text-zinc-700">{badge.name}</p>
                  <p className="text-[8px] text-zinc-400">{badge.condition}</p>

                  {/* 호버 툴팁 */}
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                    <div className="bg-zinc-800 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap">
                      {badge.condition}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 안내 */}
      <div className="mt-6 rounded-xl bg-zinc-50 p-4">
        <p className="text-xs text-zinc-500 leading-relaxed">
          배지는 사이트 상세 페이지에서 자동으로 표시돼요.
          방문자가 늘어날수록 더 많은 배지를 모을 수 있어요!
        </p>
      </div>
    </div>
  );
}
