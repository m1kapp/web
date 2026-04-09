"use client";

import { useState } from "react";

export function ShareButton({ slug, title }: { slug: string; title: string }) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const host = process.env.NEXT_PUBLIC_HOST || "m1k.app";
  const url = `https://${host}/${slug}`;

  async function handleCopyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowMenu(false);
  }

  function handleTwitter() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title} - 방문자 1K를 향해! 🚀`)}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
    setShowMenu(false);
  }

  function handleNativeShare() {
    if (navigator.share) {
      navigator.share({ title: `${title} | m1k`, url });
    }
    setShowMenu(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-zinc-100 py-1 min-w-36 overflow-hidden">
            <button
              onClick={handleCopyLink}
              className="w-full text-left px-3 py-2.5 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              {copied ? "복사됨!" : "링크 복사"}
            </button>
            <button
              onClick={handleTwitter}
              className="w-full text-left px-3 py-2.5 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X(트위터) 공유
            </button>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                onClick={handleNativeShare}
                className="w-full text-left px-3 py-2.5 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors flex items-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                더보기...
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
