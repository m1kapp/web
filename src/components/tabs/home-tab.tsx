"use client";

import { useState, useEffect } from "react";
import { SiteCard } from "@/components/site-card";
import { SectionHeader, Divider } from "@/components/ui-parts";
import type { RecentSite } from "@/lib/types";

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

export function HomeTab({
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
