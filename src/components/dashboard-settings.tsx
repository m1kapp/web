"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
