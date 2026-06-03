"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams, useRouter } from "next/navigation";

type Status = "idle" | "loading" | "success" | "error";

function ClaimInner() {
  const { isSignedIn, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [site, setSite] = useState<{ slug: string; title?: string | null } | null>(null);
  const ran = useRef(false);

  // 로그인 안 됐으면 토큰 보존한 채 로그인으로
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const back = `/claim?token=${encodeURIComponent(token)}`;
      router.replace(`/sign-in?redirect=${encodeURIComponent(back)}`);
    }
  }, [isLoaded, isSignedIn, token, router]);

  // 로그인 됐고 토큰 있으면 자동 귀속 (한 번만)
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !token || ran.current) return;
    ran.current = true;
    fetch("/api/sites/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ claimToken: token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setStatus("error");
          setMessage(data?.error || data?.message || "귀속에 실패했어요");
          return;
        }
        setStatus("success");
        setSite({ slug: data.slug, title: data.title });
      })
      .catch(() => {
        setStatus("error");
        setMessage("네트워크 오류가 발생했어요");
      });
  }, [isLoaded, isSignedIn, token]);

  const spinner = (
    <div className="w-6 h-6 rounded-full border-2 border-zinc-300 border-t-zinc-600 animate-spin" />
  );

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-white dark:bg-zinc-950">
      <div className="w-full max-w-[340px] text-center">
        <h1 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white mb-1">m1k</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">사이트 소유권 귀속</p>

        {!token && (
          <p className="text-sm text-red-500">claim 토큰이 없어요. CLI에서 발급한 링크로 접속하세요.</p>
        )}

        {token && (!isLoaded || status === "loading" || status === "idle") && (
          <div className="flex flex-col items-center gap-3">
            {spinner}
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {isLoaded ? "내 계정에 귀속하는 중…" : "확인 중…"}
            </p>
          </div>
        )}

        {status === "success" && site && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500 text-2xl">
              ✓
            </div>
            <p className="text-sm text-zinc-700 dark:text-zinc-200">
              <b>{site.title || site.slug}</b> 사이트가 내 계정에 귀속됐어요.
            </p>
            <div className="flex gap-2 w-full">
              <button
                onClick={() => router.push("/my")}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-zinc-900 dark:bg-white dark:text-zinc-900"
              >
                내 사이트 보기
              </button>
              <button
                onClick={() => router.push(`/${site.slug}`)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800"
              >
                대시보드
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center text-red-500 text-2xl">
              !
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{message}</p>
            <button
              onClick={() => router.push("/my")}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800"
            >
              내 사이트로
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={null}>
      <ClaimInner />
    </Suspense>
  );
}
