"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";
import { GoogleLoginButton } from "@/components/google-login-button";
import { GitHubLoginButton } from "@/components/github-login-button";

export default function SignInPage() {
  const { isSignedIn, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams.get("redirect") || "/my";

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // 이미 로그인 상태면 redirect로 이동
      if (redirect.startsWith("http")) {
        window.location.href = redirect;
      } else {
        router.replace(redirect);
      }
    }
  }, [isLoaded, isSignedIn, redirect, router]);

  if (!isLoaded || isSignedIn) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-300 border-t-zinc-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white dark:bg-zinc-950">
      <div className="w-full max-w-[320px]">
        {/* 로고 */}
        <h1 className="text-3xl font-black tracking-tighter text-center text-zinc-900 dark:text-white mb-2">
          m1k
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-8">
          방문자 1,000명을 향한 첫걸음
        </p>

        {/* 로그인 버튼 */}
        <div className="flex flex-col gap-2.5">
          <GoogleLoginButton
            className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl text-sm font-bold text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 transition-colors"
          />
          <GitHubLoginButton
            className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl text-sm font-bold text-white bg-zinc-700 dark:bg-zinc-800 dark:text-white transition-colors"
          />
        </div>

        <p className="text-[11px] text-zinc-400 dark:text-zinc-600 text-center mt-6 leading-relaxed">
          로그인하면 사이트를 등록하고<br />1K 도전을 시작할 수 있어요
        </p>
      </div>
    </div>
  );
}
