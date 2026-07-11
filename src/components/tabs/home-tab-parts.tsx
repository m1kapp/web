"use client";

import { useState, useEffect } from "react";

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

export function TypewriterHero({ bgColor }: { bgColor: string }) {
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

const FAQ_ITEMS = [
  {
    q: "m1k가 뭐예요?",
    a: "make 1k — 내가 만든 서비스의 첫 1,000명 방문자를 만들어보자는 뜻이에요. 사이트에 뱃지를 달면 방문자를 자동으로 세어주고, 1K를 시작으로 10K, 100K, 1M까지 함께 성장해나가요.",
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
    a: "네! 사이트 등록, 뱃지, 대시보드, 분석 모두 무료예요.",
  },
];

export function FAQSection() {
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
