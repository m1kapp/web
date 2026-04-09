"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useAccent } from "@/lib/theme-context";

const BOOST_PLANS = [
  { label: "100", boosts: 100, price: "₩2,000", priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_100 || "" },
  { label: "300", boosts: 300, price: "₩3,000", priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_300 || "" },
  { label: "600", boosts: 600, price: "₩4,000", priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_600 || "", popular: true },
  { label: "900", boosts: 900, price: "₩5,000", priceId: process.env.NEXT_PUBLIC_PADDLE_PRICE_900 || "" },
];

export function BoostShop({ onPurchased }: { onPurchased?: () => void }) {
  const { user } = useUser();
  const [loading, setLoading] = useState<string | null>(null);

  let accent: string;
  try {
    const ctx = useAccent();
    accent = ctx.accent;
  } catch {
    accent = "#ec4899";
  }

  function handleBuy(plan: typeof BOOST_PLANS[0]) {
    const Paddle = (window as any).Paddle;
    if (!Paddle?.Checkout) {
      alert("결제 시스템을 불러오는 중이에요. 잠시 후 다시 시도해주세요.");
      return;
    }

    setLoading(plan.priceId);

    Paddle.Checkout.open({
      items: [{ priceId: plan.priceId, quantity: 1 }],
      customer: user?.primaryEmailAddress?.emailAddress
        ? { email: user.primaryEmailAddress.emailAddress }
        : undefined,
      customData: { userId: user?.id },
      settings: {
        successUrl: `${window.location.origin}?boost=success`,
        theme: "light",
        locale: "ko",
      },
    });

    // 체크아웃이 닫히면 로딩 해제
    setTimeout(() => setLoading(null), 1000);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">🚀 부스트 충전</h3>
        <span className="text-[10px] text-zinc-400">10원 = 1 부스트</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {BOOST_PLANS.map((plan) => (
          <button
            key={plan.label}
            onClick={() => handleBuy(plan)}
            disabled={!!loading}
            className={`relative rounded-xl p-3 text-center transition-all active:scale-[0.97] disabled:opacity-50 ${
              plan.popular
                ? "text-white"
                : "bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            style={plan.popular ? { backgroundColor: accent } : undefined}
          >
            {plan.popular && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold bg-zinc-900 text-white px-2 py-0.5 rounded-full">
                인기
              </span>
            )}
            <p className="text-lg font-black tabular-nums">🚀 {plan.label}</p>
            <p className={`text-[11px] font-semibold ${plan.popular ? "opacity-80" : "text-zinc-500"}`}>
              {plan.price}
            </p>
          </button>
        ))}
      </div>

      <p className="text-[10px] text-zinc-400 text-center">
        결제는 Paddle을 통해 안전하게 처리돼요
      </p>
    </div>
  );
}
