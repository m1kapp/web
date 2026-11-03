"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "m1k가 뭐예요?",
    a: "메이커가 만든 웹앱을 모은 스토어예요. make 1k — 내가 만든 서비스의 첫 1,000명 방문자를 만들어보자는 뜻이에요. 사이트에 뱃지를 달면 방문자를 자동으로 세어주고, 1K를 시작으로 10K, 100K, 1M까지 함께 성장해나가요.",
  },
  {
    q: "누구를 위한 서비스인가요?",
    a: "바이브코딩으로 만든 서비스, 주말 토이 프로젝트, 해커톤 앱 — 만들고 방치되는 사이드 프로젝트를 가꿔나가고 싶은 모든 메이커를 위한 서비스예요.",
  },
  {
    q: "어떤 앱을 등록할 수 있나요?",
    a: "웹앱만 취급해요. 설치 없이 브라우저에서 바로 열리는 서비스면 돼요. 뱃지를 사이트에 심으면 자동으로 소유권이 인증되고, 탐색 목록에 노출돼요.",
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
