"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 rounded-md px-2 py-1 text-xs bg-background border hover:bg-accent transition-colors"
    >
      {copied ? "복사됨!" : "복사"}
    </button>
  );
}
