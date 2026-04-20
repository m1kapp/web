"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccent } from "@/lib/theme-context";
import { Section } from "@m1kapp/kit";
import { useCopy } from "@/lib/use-copy";
import { buildBadgeSnippet } from "@/lib/badge";
import { GoogleLoginButton } from "./google-login-button";
import { GitHubLoginButton } from "./github-login-button";

export function RefreshOgButton({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleRefresh() {
    setLoading(true);
    try {
      await fetch("/api/sites/refresh-og", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="w-full text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors py-2 disabled:opacity-50"
    >
      {loading ? "새로고침 중..." : done ? "✓ OG 정보 업데이트됨" : "OG 정보 새로고침"}
    </button>
  );
}

export function DeleteSiteButton({ slug }: { slug: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/sites/settings", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (res.ok) router.push("/");
    } finally {
      setDeleting(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="w-full text-xs text-zinc-400 hover:text-red-500 transition-colors py-2"
      >
        사이트 삭제
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-4 space-y-3">
      <p className="text-sm font-semibold text-red-600 dark:text-red-400">정말 삭제하시겠어요?</p>
      <p className="text-xs text-red-500/70">모든 방문 기록과 뱃지 데이터가 삭제됩니다. 이 작업은 되돌릴 수 없어요.</p>
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 py-2 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {deleting ? "삭제 중..." : "삭제"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="flex-1 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  );
}

export function PendingBanner({ slug, host }: { slug: string; host: string }) {
  const { accent } = useAccent();
  const { copied, copy } = useCopy();
  const snippet = buildBadgeSnippet(host, slug);

  return (
    <Section>
      <div className="rounded-xl border-2 border-dashed p-4 space-y-3" style={{ borderColor: accent }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse" style={{ backgroundColor: accent }}>
            !
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">뱃지를 사이트에 심어주세요</h3>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">
          아래 코드를 내 사이트에 붙여넣으면 인증이 완료되고, 탐색 목록에 노출돼요.
        </p>
        <pre className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-3 pr-4 text-[11px] text-zinc-700 dark:text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all">
          {snippet}
        </pre>
        <button
          onClick={() => copy(snippet)}
          className="w-full py-2 rounded-lg text-[11px] font-semibold text-white transition-colors"
          style={{ backgroundColor: copied ? "#22c55e" : accent }}
        >
          {copied ? "복사됨!" : "복사"}
        </button>
        <p className="text-[10px] text-zinc-400">방문자가 뱃지를 로드하면 자동으로 인증 완료됩니다</p>
      </div>
    </Section>
  );
}

export function SettingsLoginPrompt({ isSignedIn }: { isSignedIn: boolean }) {
  const { accent } = useAccent();

  return (
    <Section className="py-16">
      <div className="flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300 dark:text-zinc-600">
            {isSignedIn ? (
              <>
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </>
            ) : (
              <>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </>
            )}
          </svg>
        </div>
        {isSignedIn ? (
          <>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">이 사이트의 소유자가 아니에요</p>
            <p className="text-xs text-zinc-400 mb-5">내 사이트를 등록하고 방문자 1,000명에 도전해보세요</p>
            <Link
              href="/my"
              className="w-full max-w-xs py-2.5 rounded-xl text-sm font-bold text-white text-center transition-colors"
              style={{ backgroundColor: accent }}
            >
              내 사이트 만들러 가기
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">내 사이트만 설정할 수 있어요</p>
            <p className="text-xs text-zinc-400 mb-5">로그인하고 사이트를 등록하면 배지와 설정을 관리할 수 있어요</p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <GoogleLoginButton
                className="flex items-center justify-center gap-2 w-full px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
                style={{ backgroundColor: accent }}
              />
              <GitHubLoginButton className="flex items-center justify-center gap-2 w-full px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-zinc-800 hover:bg-zinc-700 transition-colors" />
            </div>
          </>
        )}
      </div>
    </Section>
  );
}
