"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccent } from "@/lib/theme-context";
import { Dialog } from "@m1kapp/kit";
import { BoostSendSheet } from "./boost-send-sheet";
import { BoostHistorySheet } from "./boost-history-sheet";

interface BoostButtonProps {
  slug: string;
  siteName: string;
  siteDescription?: string | null;
  siteOgImage?: string | null;
  siteColor?: string | null;
  isSignedIn: boolean;
  totalBoosted?: number;
}

export function BoostButton({ slug, siteName, siteDescription, siteOgImage, siteColor, isSignedIn, totalBoosted = 0 }: BoostButtonProps) {
  const { accent } = useAccent();
  const router = useRouter();
  const [openSend, setOpenSend] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  function handleBoostClick() {
    if (!isSignedIn) { setShowLoginPrompt(true); return; }
    setOpenSend(true);
  }

  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={handleBoostClick}
          className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98]"
          style={{ backgroundColor: accent }}
        >
          🚀 응원하기
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
        >
          응원 내역 🚀{totalBoosted.toLocaleString()}
        </button>
      </div>
      <p className="text-[10px] text-zinc-400 dark:text-zinc-600 text-center mt-1.5">
        응원 포인트는 방문자 수에 합산돼요
      </p>

      <BoostSendSheet
        open={openSend}
        onClose={() => setOpenSend(false)}
        slug={slug}
        siteName={siteName}
        siteDescription={siteDescription}
        siteOgImage={siteOgImage}
        siteColor={siteColor}
        onSuccess={() => {}}
      />

      <BoostHistorySheet
        open={showHistory}
        onClose={() => setShowHistory(false)}
        site={{ slug, name: siteName, description: siteDescription, ogImage: siteOgImage, color: siteColor }}
        onBoost={handleBoostClick}
      />

      <Dialog open={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} title="로그인이 필요해요">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
          로그인 후 응원 포인트를 보낼 수 있어요. 로그인 페이지로 이동할까요?
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowLoginPrompt(false); router.push("/my"); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
            style={{ backgroundColor: accent }}
          >
            로그인하기
          </button>
          <button
            onClick={() => setShowLoginPrompt(false)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            취소
          </button>
        </div>
      </Dialog>
    </>
  );
}
