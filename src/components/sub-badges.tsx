"use client";

import { useState, useEffect } from "react";
import { useAccent } from "@/lib/theme-context";
import { useCopy } from "@/lib/use-copy";
import { buildBadgeSnippet } from "@/lib/badge";

interface SubBadge {
  slug: string;
  path: string | null;
  title: string | null;
  verified: boolean;
  total: number;
}

export function SubBadges({ slug, host, isOwner }: { slug: string; host: string; isOwner: boolean }) {
  const { accent } = useAccent();
  const [subs, setSubs] = useState<SubBadge[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [path, setPath] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { copied, copy: copySnippet } = useCopy();

  useEffect(() => {
    fetch(`/api/sites/sub?parentSlug=${slug}`)
      .then((res) => res.json())
      .then((data) => Array.isArray(data) ? setSubs(data) : setSubs([]))
      .catch(() => {});
  }, [slug]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!path.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/sites/sub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentSlug: slug, path: path.trim(), title: title.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubs((prev) => [...prev, data]);
        setPath("");
        setTitle("");
        setShowForm(false);
      } else {
        setError(data.error || "추가에 실패했어요");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          하위 뱃지 <span className="text-zinc-300 dark:text-zinc-600 font-normal">{subs.length}</span>
        </h3>
        {isOwner && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg text-white transition-colors"
            style={{ backgroundColor: accent }}
          >
            {showForm ? "취소" : "+ 추가"}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-3 space-y-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2">
            <span className="text-zinc-300 text-sm shrink-0">/</span>
            <input
              type="text"
              placeholder="post/123"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none"
              required
            />
          </div>
          <input
            type="text"
            placeholder="라벨 (선택)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50"
            style={{ backgroundColor: accent }}
          >
            {loading ? "추가 중..." : "하위 뱃지 추가"}
          </button>
        </form>
      )}

      {subs.length > 0 ? (
        <div className="space-y-1.5">
          {subs.map((sub) => (
            <div key={sub.slug} className="flex items-center gap-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 p-3">
              <div className="flex-1 min-w-0">
                <a href={`/${sub.slug}`} className="hover:underline">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                    /{sub.path}
                  </p>
                </a>
                {sub.title && sub.title !== `/${sub.path}` && (
                  <p className="text-[10px] text-zinc-400 truncate">{sub.title}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs tabular-nums font-semibold text-zinc-500">
                  {Number(sub.total).toLocaleString()}
                </span>
                {!sub.verified && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="미인증" />
                )}
                <button
                  onClick={() => copySnippet(buildBadgeSnippet(host, sub.slug), sub.slug)}
                  className="text-[10px] font-semibold px-2 py-1 rounded-md transition-colors text-white"
                  style={{ backgroundColor: copied === sub.slug ? "#22c55e" : accent }}
                >
                  {copied === sub.slug ? "복사됨" : "코드"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : !showForm && (
        <p className="text-xs text-zinc-400 text-center py-3">
          {isOwner ? "페이지별 방문 추적을 시작해보세요" : "아직 하위 뱃지가 없어요"}
        </p>
      )}
    </div>
  );
}
