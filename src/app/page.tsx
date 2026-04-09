"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Show, UserButton } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { GoogleLoginButton } from "@/components/google-login-button";
import { Watermark } from "@/components/watermark";
import { SiteCard } from "@/components/site-card";
import { AppShell, SectionHeader, Divider, EmptyState, TabButton } from "@/components/ui-parts";
import { useConfetti } from "@/components/confetti";
import { BoostShop } from "@/components/boost-shop";

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
  const [recentSites, setRecentSites] = useState<RecentSite[]>([]);
  const [mySites, setMySites] = useState<RecentSite[]>([]);
  const [bgColor, setBgColor] = useState("#0f172a");
  const [tab, setTab] = useState<"home" | "store" | "badge" | "my">("home");
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

  return (
    <Watermark color={bgColor}>
      <AppShell className="bg-white dark:bg-zinc-950 **:transition-[color,background-color] **:duration-500">
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
              bgColor={bgColor}
              recentSites={recentSites}
              onStart={() => setTab("my")}
            />
          ) : tab === "store" ? (
            <StoreTab
              sites={recentSites}
              bgColor={bgColor}
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
            <MyTab
              sites={mySites}
              isSignedIn={!!isSignedIn}
              bgColor={bgColor}
              onRegistered={() => {
                fetch("/api/sites/mine")
                  .then((res) => res.json())
                  .then((data) => Array.isArray(data) ? setMySites(data) : setMySites([]))
                  .catch(() => {});
              }}
            />
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

const ROLLING_WORDS = [
  "바이브코딩으로 만든 서비스",
  "주말에 만든 토이 프로젝트",
  "혼자 만든 미니 서비스",
  "첫 번째 사이드 프로젝트",
  "해커톤에서 만든 앱",
  "새벽에 만든 그 사이트",
  "출시만 하고 잊어버린 서비스",
  "어제 배포한 그 앱",
];

function RollingHero({ bgColor }: { bgColor: string }) {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % ROLLING_WORDS.length);
        setFade(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mb-4">
      <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white leading-snug">
        <span>그{" "}</span>
        <span
          className="inline-block transition-all duration-300"
          style={{
            color: bgColor,
            opacity: fade ? 1 : 0,
            transform: fade ? "translateY(0)" : "translateY(-8px)",
          }}
        >
          {ROLLING_WORDS[index]}
        </span>
        ,
        <br />
        아직 살아있나요?
      </h1>
    </div>
  );
}

function HomeTab({
  bgColor,
  recentSites,
  onStart,
}: {
  bgColor: string;
  recentSites: RecentSite[];
  onStart: () => void;
}) {
  return (
    <>
      {/* 히어로 */}
      <div className="px-4 pt-8 pb-6 text-center">
        {/* 롤링 헤드카피 */}
        <RollingHero bgColor={bgColor} />

        <p className="text-zinc-500 text-sm leading-relaxed mb-6">
          뱃지 하나 달면 달라져요.{"\n"}
          누군가 찾아왔다는 숫자 하나가,{"\n"}
          포기 대신 한 번 더 손보게 만들어요.
        </p>

        {/* 3스텝 온보딩 */}
        <div className="flex gap-3 mb-6">
          {[
            { step: "1", title: "사이트 등록", desc: "내 서비스 URL" },
            { step: "2", title: "배지 달기", desc: "코드 한 줄 복붙" },
            { step: "3", title: "함께 성장", desc: "응원하고 응원받고" },
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

        {/* 시작하기 버튼 */}
        <button
          onClick={onStart}
          className="w-full h-12 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98]"
          style={{ backgroundColor: bgColor }}
        >
          시작하기
        </button>
      </div>

      {/* 부스트 안내 */}
      <div className="px-4 pb-2">
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 p-4 space-y-2.5">
          <p className="text-sm font-bold text-zinc-800 dark:text-white">🚀 부스트가 뭐예요?</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            m1k의 뱃지에 표시되는 숫자, 알고 계시죠?{"\n"}
            부스트를 보내면 <span className="font-semibold text-zinc-700 dark:text-zinc-300">그 숫자가 올라갑니다.</span>
          </p>
          <div className="rounded-lg bg-white dark:bg-zinc-800 p-3 text-xs text-zinc-500 space-y-1">
            <p>내 블로그 뱃지에 <span className="font-bold text-zinc-800 dark:text-zinc-200">1,247</span>이라고 써 있다면</p>
            <p>실제 방문자 1,100명 + 🚀 부스트 147개</p>
            <p>뱃지에는 <span className="font-bold text-zinc-800 dark:text-zinc-200">1,247</span>로 함께 표시돼요</p>
          </div>
          <div className="space-y-1 text-[11px] text-zinc-400">
            <p>🙋 내 사이트를 더 있어보이게</p>
            <p>🎁 친구 블로그에 응원으로 선물</p>
            <p>🏃 1K 달성 목표를 앞당기기</p>
          </div>
          <p className="text-[11px] font-semibold" style={{ color: bgColor }}>
            가입하면 🚀 100 부스트를 바로 드려요.
          </p>
        </div>
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

function StoreTab({ sites: initialSites, onRefreshItem, bgColor }: { sites: RecentSite[]; onRefreshItem: (slug: string) => Promise<void>; bgColor: string }) {
  const [refreshingSlug, setRefreshingSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "popular" | "name">("recent");
  const [filteredSites, setFilteredSites] = useState<RecentSite[]>(initialSites);
  const [searching, setSearching] = useState(false);
  const [ranking, setRanking] = useState<RecentSite[]>([]);

  // 랭킹 로드
  useEffect(() => {
    fetch("/api/sites/recent?sort=popular")
      .then((res) => res.json())
      .then((data) => Array.isArray(data) ? setRanking(data.slice(0, 5)) : setRanking([]))
      .catch(() => {});
  }, []);

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

      {/* 1K 레이스 랭킹 */}
      {ranking.length > 0 && !searchQuery && (
        <div className="mb-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: bgColor }}>
            1K 레이스
          </h3>
          <div className="space-y-1.5">
            {ranking.map((site, i) => {
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
              const progress = Math.min(Number(site.total) / 1000, 1);
              return (
                <a
                  key={site.slug}
                  href={`/${site.slug}`}
                  className="flex items-center gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-base w-6 text-center shrink-0">{medal}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                      {site.ogTitle || site.title || site.slug}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.max(progress * 100, 1)}%`, backgroundColor: bgColor }}
                        />
                      </div>
                      <span className="text-[10px] tabular-nums font-semibold text-zinc-500 shrink-0">
                        {Number(site.total).toLocaleString()} / 1K
                      </span>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
          <Divider />
        </div>
      )}

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
  onRegistered,
}: {
  sites: RecentSite[];
  isSignedIn: boolean;
  bgColor: string;
  onRegistered: () => void;
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
  const [pointBalance, setPointBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/points")
      .then((r) => r.json())
      .then((d) => setPointBalance(d.balance ?? null))
      .catch(() => {});
  }, []);

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
            {pointBalance !== null && (
              <span className="ml-1.5">· 🚀 <span className="font-semibold text-zinc-600 dark:text-zinc-300">{pointBalance.toLocaleString()}</span></span>
            )}
          </p>
        </div>
      </div>

      {/* 사이트 등록 폼 */}
      <RegisterForm bgColor={bgColor} onRegistered={onRegistered} />

      <Divider />

      {/* 내 사이트 목록 */}
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

      {/* 부스트 충전 */}
      <BoostShop onPurchased={() => {
        fetch("/api/points")
          .then((r) => r.json())
          .then((d) => setPointBalance(d.balance ?? null))
          .catch(() => {});
      }} />
    </div>
  );
}

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

// ── 배지 월드 — 달성 뱃지 시스템 ──
const ACHIEVEMENT_BADGES = [
  {
    category: "1K 여정",
    desc: "0 → 1,000 방문자",
    items: [
      { icon: "🌱", name: "새싹", condition: "첫 방문자" },
      { icon: "🐣", name: "병아리", condition: "누적 10명" },
      { icon: "🔥", name: "불꽃", condition: "누적 50명" },
      { icon: "⭐", name: "스타", condition: "누적 100명" },
      { icon: "👑", name: "왕관", condition: "누적 250명" },
      { icon: "💎", name: "다이아", condition: "누적 500명" },
      { icon: "🏆", name: "트로피", condition: "누적 750명" },
      { icon: "🚀", name: "로켓", condition: "1K 달성!" },
    ],
  },
  {
    category: "10K 우주",
    desc: "1K → 10K 방문자",
    items: [
      { icon: "🛸", name: "UFO", condition: "누적 2,500명" },
      { icon: "🌕", name: "보름달", condition: "누적 5,000명" },
      { icon: "☄️", name: "혜성", condition: "누적 7,500명" },
      { icon: "🪐", name: "행성", condition: "10K 달성!" },
    ],
  },
  {
    category: "100K 은하",
    desc: "10K → 100K 방문자",
    items: [
      { icon: "🌌", name: "은하수", condition: "누적 25,000명" },
      { icon: "🔭", name: "망원경", condition: "누적 50,000명" },
      { icon: "🌠", name: "유성우", condition: "누적 75,000명" },
      { icon: "💫", name: "빅뱅", condition: "100K 달성!" },
    ],
  },
  {
    category: "1M 신화",
    desc: "100K → 1M 방문자",
    items: [
      { icon: "🏛️", name: "판테온", condition: "누적 250,000명" },
      { icon: "🗿", name: "모아이", condition: "누적 500,000명" },
      { icon: "⚜️", name: "레전드", condition: "누적 750,000명" },
      { icon: "👼", name: "신화", condition: "1M 달성!" },
    ],
  },
  {
    category: "주간 달성",
    desc: "이번 주 방문수 기준",
    items: [
      { icon: "🐢", name: "거북이", condition: "주간 1명" },
      { icon: "🐇", name: "토끼", condition: "주간 10명" },
      { icon: "🦅", name: "독수리", condition: "주간 50명" },
      { icon: "🐉", name: "용", condition: "주간 100명" },
      { icon: "🦖", name: "공룡", condition: "주간 500명" },
      { icon: "🐋", name: "대왕고래", condition: "주간 1,000명" },
    ],
  },
  {
    category: "일간 달성",
    desc: "오늘 방문수 기준",
    items: [
      { icon: "☀️", name: "맑음", condition: "오늘 1명" },
      { icon: "🌈", name: "무지개", condition: "오늘 10명" },
      { icon: "⚡", name: "번개", condition: "오늘 50명" },
      { icon: "🌋", name: "폭발", condition: "오늘 100명" },
      { icon: "🌪️", name: "토네이도", condition: "오늘 500명" },
      { icon: "☄️", name: "대폭발", condition: "오늘 1,000명" },
    ],
  },
  {
    category: "연속 기록",
    desc: "매일 방문자가 찾아오면",
    items: [
      { icon: "📅", name: "3일 연속", condition: "3일 연속 방문" },
      { icon: "🔥", name: "7일 연속", condition: "7일 연속 방문" },
      { icon: "💪", name: "14일 연속", condition: "2주 연속 방문" },
      { icon: "🎯", name: "30일 연속", condition: "한 달 연속 방문" },
      { icon: "🏅", name: "60일 연속", condition: "두 달 연속 방문" },
      { icon: "🐐", name: "100일 연속", condition: "100일 연속 방문!" },
      { icon: "♾️", name: "365일 연속", condition: "1년 개근!" },
    ],
  },
];

const GOAL_REWARDS = [
  {
    tier: "🚀 1K",
    color: "#ec4899",
    rewards: [
      { icon: "🏆", title: "1K 트로피 배지", desc: "대시보드에 영구 표시" },
      { icon: "🎨", title: "프리미엄 뱃지 스타일", desc: "골드 테마 해금" },
    ],
  },
  {
    tier: "🪐 10K",
    color: "#a855f7",
    rewards: [
      { icon: "📊", title: "상세 분석 리포트", desc: "월간 트렌드 분석" },
      { icon: "🌟", title: "탐색 상단 고정", desc: "스토어 추천 사이트" },
    ],
  },
  {
    tier: "💫 100K",
    color: "#3b82f6",
    rewards: [
      { icon: "🏅", title: "명예의 전당", desc: "100K 클럽 등재" },
      { icon: "✨", title: "커스텀 뱃지", desc: "나만의 SVG 디자인" },
    ],
  },
  {
    tier: "👼 1M",
    color: "#22c55e",
    rewards: [
      { icon: "🗿", title: "전설의 사이트", desc: "m1k 레전드 인증" },
      { icon: "🎭", title: "m1k 앰배서더", desc: "공식 파트너 배지" },
    ],
  },
];

function BadgeWorldTab({ bgColor }: { bgColor: string }) {
  const fire = useConfetti();
  const [showRewards, setShowRewards] = useState(false);

  return (
    <div className="px-4 py-5">
      <h2 className="text-lg font-bold text-zinc-900 mb-1">배지 월드</h2>
      <p className="text-xs text-zinc-400 mb-6">
        방문자가 늘어날수록 새로운 배지를 획득해요
      </p>

      {/* 달성 보상 미리보기 */}
      <div className="mb-6">
        <button
          onClick={() => {
            fire();
            setShowRewards(!showRewards);
          }}
          className="w-full rounded-2xl p-5 text-center text-white transition-all active:scale-[0.98] relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${bgColor}, ${bgColor}dd)`,
          }}
        >
          <div className="relative z-10">
            <span className="text-3xl block mb-2">🚀</span>
            <p className="text-base font-black mb-1">달성하면 뭐가 열릴까?</p>
            <p className="text-[11px] opacity-80">눌러서 미리 체험해보세요</p>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]" style={{ animationName: "shimmer" }} />
        </button>

        {/* 단계별 보상 카드 */}
        {showRewards && (
          <div className="mt-3 space-y-4">
            {GOAL_REWARDS.map((goal) => (
              <div key={goal.tier}>
                <p className="text-xs font-bold mb-2" style={{ color: goal.color }}>
                  {goal.tier} 달성 보상
                </p>
                <div className="space-y-1.5">
                  {goal.rewards.map((r) => (
                    <div
                      key={r.title}
                      className="flex items-center gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3"
                    >
                      <span className="text-2xl">{r.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{r.title}</p>
                        <p className="text-[10px] text-zinc-400">{r.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 배지 갤러리 */}
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
    </div>
  );
}
