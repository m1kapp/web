"use client";

import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { Avatar } from "@/components/avatar";
import { useRouter } from "next/navigation";
import { useFormSubmit } from "@m1kapp/kit";

export function RegisterForm({
  bgColor,
  onRegistered,
  onClose,
}: {
  bgColor: string;
  onRegistered: () => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [validationError, setValidationError] = useState("");
  const router = useRouter();

  function isValidDomain(str: string): boolean {
    return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9-]{1,})*\.[a-zA-Z]{2,}([/][^\s]*)?$/.test(str);
  }

  const { submit, loading, error: submitError } = useFormSubmit<{ slug: string }, string>(
    async (normalized) => {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "등록에 실패했어요");
      return data;
    },
    {
      onSuccess: (data) => {
        setUrl("");
        onRegistered();
        onClose();
        router.push(`/${data.slug}`);
      },
    }
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError("");
    const normalized = url
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/+$/, "");

    if (!normalized) {
      setValidationError("URL을 입력해주세요");
      return;
    }
    if (!isValidDomain(normalized)) {
      setValidationError("올바른 도메인을 입력해주세요 (예: blog.naver.com/dellose)");
      return;
    }
    submit(normalized);
  }

  const error = validationError || submitError?.message;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="rounded-xl border border-zinc-200 px-4 py-3 focus-within:border-zinc-400 transition-colors">
        <input
          type="text"
          placeholder="https://blog.naver.com/dellose"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setValidationError(""); }}
          className="w-full bg-transparent text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none"
          required
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 px-1">{error}</p>
      )}
      <p className="text-[11px] text-zinc-400 px-1">
        전체 URL을 붙여넣어도 되고, `https://` 는 자동으로 정리돼요.
      </p>
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

/** 프로필 카드 — 아바타·핸들·사이트/방문 요약·로그아웃 */
export function ProfileHeader({ sitesCount, totalHits }: {
  sitesCount: number; totalHits: number;
}) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const handle = user?.username || user?.primaryEmailAddress?.emailAddress.split("@")[0];

  return (
    <div className="flex items-center gap-3 mb-5 justify-between">
      <div className="flex items-center gap-3">
        <Avatar imageUrl={user?.imageUrl} name={user?.firstName || user?.username || "?"} size={44} />
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            {user?.firstName || user?.username || "나"}
          </h2>
          {handle && (
            <a href={`/@${handle}`} className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
              @{handle}
            </a>
          )}
          <p className="text-xs text-zinc-400">
            {sitesCount}개 사이트 · 총 {totalHits.toLocaleString()}명 방문
          </p>
        </div>
      </div>
      <button
        onClick={() => signOut()}
        className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors px-2 py-1"
      >
        로그아웃
      </button>
    </div>
  );
}
