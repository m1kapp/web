"use client";

import { useState, useEffect } from "react";
import { SiteCard } from "@/components/site-card";
import { SectionHeader } from "@m1kapp/ui";
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

function TypewriterHero({ bgColor }: { bgColor: string }) {
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(ROLLING_WORDS[0].length);
  const [deleting, setDeleting] = useState(false);
  const [blink, setBlink] = useState(true);

  const currentWord = ROLLING_WORDS[wordIndex];

  // 커서 깜빡임 (타이핑 중엔 멈추고, 대기 중에만 깜빡)
  const isTyping = !deleting ? charIndex < currentWord.length : charIndex > 0;
  useEffect(() => {
    if (isTyping) return;
    const interval = setInterval(() => setBlink((b) => !b), 530);
    return () => clearInterval(interval);
  }, [isTyping]);

  useEffect(() => {
    if (!deleting && charIndex < currentWord.length) {
      // 타이핑 — 불규칙 딜레이 (사람처럼)
      const base = 60;
      const jitter = Math.random() * 80;
      // 띄어쓰기 후엔 살짝 멈칫
      const pause = currentWord[charIndex - 1] === " " ? 30 : 0;
      const timer = setTimeout(() => setCharIndex((c) => c + 1), base + jitter + pause);
      return () => clearTimeout(timer);
    }
    if (!deleting && charIndex === currentWord.length) {
      const timer = setTimeout(() => setDeleting(true), 2200);
      return () => clearTimeout(timer);
    }
    if (deleting && charIndex > 0) {
      // 삭제 — 빠르고 약간 불규칙
      const timer = setTimeout(() => setCharIndex((c) => c - 1), 25 + Math.random() * 20);
      return () => clearTimeout(timer);
    }
    if (deleting && charIndex === 0) {
      const timer = setTimeout(() => {
        setDeleting(false);
        setWordIndex((i) => (i + 1) % ROLLING_WORDS.length);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [charIndex, deleting, currentWord]);

  const displayText = currentWord.slice(0, charIndex);
  const lastChar = displayText[displayText.length - 1];
  const rest = displayText.slice(0, -1);

  return (
    <span style={{ color: bgColor }}>
      {charIndex > 0 && (
        <>
          {rest}
          <span
            key={`${wordIndex}-${charIndex}`}
            className="inline-block"
            style={{
              animation: !deleting ? "charPop 0.1s ease-out" : undefined,
            }}
          >
            {lastChar}
          </span>
        </>
      )}
      <span
        className="inline-block w-0.5 h-[1em] ml-px align-middle rounded-full"
        style={{
          backgroundColor: bgColor,
          opacity: isTyping || blink ? 1 : 0,
          transition: "opacity 0.1s",
        }}
      />
      <style>{`
        @keyframes charPop {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </span>
  );
}


export function HomeTab({
  bgColor,
  recentSites,
  selfSlug,
  onStart,
}: {
  bgColor: string;
  recentSites: RecentSite[];
  selfSlug: string | null;
  onStart: () => void;
}) {

  return (
    <>
      {/* 싸이월드 방문자 카운터 — 최상단 얇은 바 */}
      {selfSlug && (
        <div className="w-full flex justify-center py-2">
          <a href={`/${selfSlug}`} target="_blank" rel="noopener noreferrer" className="block h-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/badge/${selfSlug}.svg`} alt="badge" className="dark:hidden" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/badge/${selfSlug}-dark.svg`} alt="badge" className="hidden dark:block" /> 
          </a>
        </div>
      )}

      {/* 히어로 */}
      <div className="px-4 pt-6 pb-8 text-center">
        <h1 className="text-5xl font-black tracking-tighter mb-1" style={{ color: bgColor }}>
          m1k
        </h1>
        <p className="text-xs text-zinc-400 mb-6">
          make 1k, m1k !
        </p>

        {/* 타이핑 + 슬로건 */}
        <div className="mb-6">
          <p className="text-lg text-zinc-400 dark:text-zinc-500 min-h-7 mb-4">
            <TypewriterHero bgColor={bgColor} />
          </p>
          <p className="text-xl font-black tracking-tight leading-snug text-zinc-900 dark:text-white">
            방문자 트래커 손쉽게 달고
          </p>
          <p className="text-xl font-black tracking-tight leading-snug" style={{ color: bgColor }}>
            1,000명 함께 만들어봐요
          </p>
        </div>

        {/* 시작하기 */}
        <button
          onClick={onStart}
          className="w-full h-12 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] mb-3"
          style={{ backgroundColor: bgColor }}
        >
          시작하기
        </button>

        {/* 3스텝 — 한 줄로 간결하게 */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400">
          <span>📝 사이트 등록</span>
          <span className="text-zinc-200">→</span>
          <span>🏷️ 트래커 심기</span>
          <span className="text-zinc-200">→</span>
          <span>🚀 함께 성장</span>
        </div>
      </div>

      {/* 최근 등록 */}
      {recentSites.length > 0 && (
        <div className="px-4 pb-2">
          <SectionHeader>최근 등록</SectionHeader>
          <div className="space-y-0">
            {recentSites.slice(0, 3).map((site) => (
              <SiteCard key={site.slug} site={site} />
            ))}
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="px-4 pt-6 pb-8">
        <SectionHeader>자주 묻는 질문</SectionHeader>
        <FAQSection />
      </div>
    </>
  );
}

const FAQ_ITEMS = [
  {
    q: "m1k가 뭐예요?",
    a: "make 1k — 내가 만든 서비스의 첫 1,000명 방문자를 만들어보자는 뜻이에요. 사이트에 뱃지를 달면 방문자를 자동으로 세어주고, 1K를 시작으로 10K, 100K, 1M까지 함께 성장해나가요.",
  },
  {
    q: "🚀 부스트가 뭐예요?",
    a: "부스트를 보내면 뱃지 카운터 숫자가 올라가요. 실제 방문자와 합산되어 표시됩니다. 내 사이트에 쓸 수도, 친구 사이트에 응원으로 보낼 수도 있어요. 가입하면 100 부스트를 바로 드려요!",
  },
  {
    q: "누구를 위한 서비스인가요?",
    a: "바이브코딩으로 만든 서비스, 주말 토이 프로젝트, 해커톤 앱 — 만들고 방치되는 사이드 프로젝트를 가꿔나가고 싶은 모든 메이커를 위한 서비스예요.",
  },
  {
    q: "어떤 사이트든 등록할 수 있나요?",
    a: "실제로 접속 가능한 도메인이면 돼요. 뱃지를 사이트에 심으면 자동으로 소유권이 인증되고, 탐색 목록에 노출돼요.",
  },
  {
    q: "무료인가요?",
    a: "네! 사이트 등록, 뱃지, 대시보드, 분석 모두 무료예요. 부스트도 가입 시 100개 무료 지급. 추가 부스트만 유료입니다.",
  },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className=" rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 overflow-hidden">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-sm font-semibold text-zinc-800 dark:text-white">{item.q}</span>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`text-zinc-400 shrink-0 ml-2 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <div
              className="grid"
              style={{
                gridTemplateRows: isOpen ? "1fr" : "0fr",
                transition: "grid-template-rows 300ms ease-in-out",
              }}
            >
              <div className="overflow-hidden">
                <p className="px-4 pb-3 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

