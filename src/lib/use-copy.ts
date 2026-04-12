"use client";

import { useState } from "react";

/**
 * 클립보드 복사 + 피드백 훅
 * PendingBanner (boolean 상태)와 SubBadges (string 키 상태) 양쪽에서 사용.
 *
 * @example
 * const { copied, copy } = useCopy();
 * copy("텍스트");            // copied === true
 * copy("텍스트", "my-key");  // copied === "my-key"
 */
export function useCopy(timeout = 2_000) {
  const [copied, setCopied] = useState<string | boolean | null>(null);

  function copy(text: string, key?: string) {
    navigator.clipboard.writeText(text);
    setCopied(key ?? true);
    setTimeout(() => setCopied(null), timeout);
  }

  return { copied, copy };
}
