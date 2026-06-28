"use client";

import { Suspense, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

function buildPrompt(token: string, origin: string): string {
  return `m1k.app 방문자 트래커를 내 사이트에 달아줘.

[내 토큰]
${token}

[등록] — 이 API를 호출해서 내 사이트를 등록해줘 (URL만 내 주소로 바꿔서):
curl -X POST ${origin}/api/sites/cli \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"내-사이트-주소.com"}'

[설치] 응답으로 받은 \`snippet\`(<a href><img></a>)을 내 사이트의 푸터나 메인 페이지 HTML에 붙여넣어줘.
그러면 방문자 추적이 시작되고, 응답의 \`dashboardUrl\`에서 통계를 볼 수 있어.`;
}

function CopyButton({ text, label = "복사" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard 거부 시 무시 */
        }
      }}
      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
    >
      {copied ? "복사됨 ✓" : label}
    </button>
  );
}

function ConnectInner() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [exists, setExists] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("https://m1k.app");

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  // 로그인 안 됐으면 로그인으로 (돌아올 곳 보존)
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace(`/sign-in?redirect=${encodeURIComponent("/connect")}`);
    }
  }, [isLoaded, isSignedIn, router]);

  // 토큰 발급 이력 확인
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetch("/api/tokens")
      .then((r) => r.json())
      .then((d) => setExists(!!d.exists))
      .catch(() => setExists(false));
  }, [isLoaded, isSignedIn]);

  const issue = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tokens", { method: "POST" });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        setExists(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-300 border-t-zinc-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 bg-white dark:bg-zinc-950">
      <div className="w-full max-w-[420px]">
        <h1 className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-white mb-1 text-center">m1k</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 text-center">
          AI(클로드)로 사이트 연결 + 뱃지 설치
        </p>

        {!token && (
          <div className="flex flex-col items-center gap-5">
            <p className="text-sm text-zinc-600 dark:text-zinc-300 text-center leading-relaxed">
              개인 토큰을 발급받아 클로드에 붙여넣으면,
              <br />
              사이트 등록부터 뱃지 설치까지 알아서 해줘요.
            </p>
            <button
              onClick={issue}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl text-sm font-bold text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 disabled:opacity-50"
            >
              {loading ? "발급 중…" : exists ? "토큰 재발급" : "토큰 발급하기"}
            </button>
            {exists && (
              <p className="text-[11px] text-zinc-400 text-center">
                이미 발급한 적이 있어요. 재발급하면 이전 토큰은 즉시 무효화됩니다.
              </p>
            )}
          </div>
        )}

        {token && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-[11px] font-bold text-zinc-400 mb-2">내 토큰 — 한 번만 보여요</p>
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-2.5">
                <code className="flex-1 text-xs text-zinc-700 dark:text-zinc-200 break-all">{token}</code>
                <CopyButton text={token} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-bold text-zinc-400">클로드에 그대로 붙여넣기</p>
                <CopyButton text={buildPrompt(token, origin)} label="프롬프트 복사" />
              </div>
              <pre className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3 text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap break-words max-h-72 overflow-auto">
                {buildPrompt(token, origin)}
              </pre>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => router.push("/my")}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800"
              >
                내 사이트
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={null}>
      <ConnectInner />
    </Suspense>
  );
}
