"use client";

import { useCallback } from "react";
import confetti from "canvas-confetti";

export function useConfetti() {
  return useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#ec4899", "#a855f7", "#3b82f6", "#22c55e", "#f97316"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#ec4899", "#a855f7", "#3b82f6", "#22c55e", "#f97316"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    // 빵 터지는 초기 폭발
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#ec4899", "#a855f7", "#3b82f6", "#22c55e", "#f97316", "#ef4444"],
    });

    frame();
  }, []);
}
