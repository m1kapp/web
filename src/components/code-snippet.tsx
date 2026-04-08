"use client";

import { useState } from "react";

export function CodeSnippet({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      onClick={handleCopy}
      className="rounded-lg bg-zinc-50 dark:bg-zinc-900 px-3 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors active:scale-[0.99]"
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold">
          {label}
        </p>
        <span className="text-[10px] text-rose-400 font-medium">
          {copied ? "복사됨!" : "탭하여 복사"}
        </span>
      </div>
      <code className="text-xs text-zinc-600 dark:text-zinc-400 break-all leading-relaxed font-mono block">
        {code}
      </code>
    </div>
  );
}
