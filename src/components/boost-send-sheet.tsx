"use client";

import { useState, useEffect } from "react";
import { useAccent } from "@/lib/theme-context";
import { InAppSheet } from "@m1kapp/kit";
import Link from "next/link";
import { SitePreviewCard } from "./site-preview-card";

const BOOST_PRESETS = [10, 50, 100] as const;
const BOOST_RESULT_DISMISS_MS = 3_000;

interface BoostSendSheetProps {
  open: boolean;
  onClose: () => void;
  slug: string;
  siteName: string;
  siteDescription?: string | null;
  siteFaviconUrl?: string | null;
  siteColor?: string | null;
  onSuccess: (injected: number) => void;
}

export function BoostSendSheet({
  open, onClose, slug, siteName, siteDescription, siteFaviconUrl, siteColor, onSuccess,
}: BoostSendSheetProps) {
  const { accent } = useAccent();
  const [amount, setAmount] = useState("10");
  const [comment, setComment] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/points")
      .then((r) => r.json())
      .then((d) => setBalance(d.balance ?? null))
      .catch(() => {});
  }, [open]);

  const num = parseInt(amount);
  const overBalance = balance !== null && num > balance;
  const canSubmit = !loading && num >= 1 && !overBalance;

  async function handleInject() {
    if (!canSubmit) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/points/inject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, amount: num, comment: comment.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess(data.injected as number);
        setBalance((prev) => prev !== null ? prev - (data.injected as number) : null);
        setAmount("10");
        setComment("");
        setResult({ message: `🚀 +${(data.injected as number).toLocaleString()} 응원 완료!`, ok: true });
        setTimeout(() => { setResult(null); onClose(); }, BOOST_RESULT_DISMISS_MS);
        window.dispatchEvent(new CustomEvent("m1k:boost-completed"));
      } else {
        setResult({ message: data.error || "실패", ok: false });
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <InAppSheet
      open={open}
      onClose={onClose}
      className="h-full max-h-full rounded-t-2xl bg-white dark:bg-zinc-950 shadow-2xl flex flex-col"
    >
        <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
          <span className="text-sm font-bold text-zinc-900 dark:text-white">🚀 응원하기</span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 text-xs"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 space-y-4" style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}>
          <SitePreviewCard
            slug={slug}
            name={siteName}
            faviconUrl={siteFaviconUrl}
            color={siteColor}
            description={siteDescription}
          />

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="응원 메시지를 남겨보세요 (선택)"
            maxLength={100}
            rows={5}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-300 dark:placeholder:text-zinc-600 focus:outline-none resize-none"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500">응원 포인트</span>
            {balance !== null && (
              <span className="text-xs text-zinc-400">
                보유 <span className={`font-bold tabular-nums ${overBalance ? "text-red-500" : "text-zinc-700 dark:text-zinc-300"}`}>{balance.toLocaleString()}</span>
                {num >= 1 && (
                  <>
                    <span className="mx-1">→</span>
                    <span className={`font-bold tabular-nums ${overBalance ? "text-red-500" : "text-zinc-700 dark:text-zinc-300"}`}>
                      {(balance - num).toLocaleString()}
                    </span>
                  </>
                )}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            {BOOST_PRESETS.map((v) => {
              const exceeds = balance !== null && v > balance;
              const selected = amount === String(v);
              return (
                <button
                  key={v}
                  onClick={() => setAmount(String(v))}
                  disabled={exceeds}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-30 ${
                    selected ? "text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                  }`}
                  style={selected && !exceeds ? { backgroundColor: accent } : undefined}
                >
                  +{v}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max={balance ?? undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm focus:outline-none tabular-nums text-zinc-900 dark:text-white ${
                overBalance ? "border-red-400 dark:border-red-500" : "border-zinc-200 dark:border-zinc-700"
              }`}
              placeholder="직접 입력"
            />
            <button
              onClick={handleInject}
              disabled={!canSubmit}
              className="px-5 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50 transition-all active:scale-[0.98]"
              style={{ backgroundColor: accent }}
            >
              {loading ? "..." : "Send 🚀"}
            </button>
          </div>

          {overBalance && (
            <p className="text-xs font-semibold text-red-500 text-center">
              보유 부스트({balance!.toLocaleString()})를 초과했어요
            </p>
          )}

          {result && (
            <p className={`text-xs font-semibold text-center ${result.ok ? "text-green-500" : "text-red-500"}`}>
              {result.message}
            </p>
          )}

          {balance !== null && balance <= 0 && (
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3 text-center">
              <p className="text-xs text-zinc-500 mb-2">응원 포인트가 부족해요</p>
              <Link
                href="/"
                className="text-[11px] font-bold px-4 py-1.5 rounded-lg text-white inline-block"
                style={{ backgroundColor: accent }}
              >
                포인트 충전하기
              </Link>
            </div>
          )}
        </div>
    </InAppSheet>
  );
}
