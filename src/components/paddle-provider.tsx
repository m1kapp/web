"use client";

import { useEffect, useRef } from "react";
import { initializePaddle } from "@paddle/paddle-js";

export function PaddleProvider() {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    if (!token) return;

    initializePaddle({
      token,
      environment: (process.env.NEXT_PUBLIC_PADDLE_ENV as "sandbox" | "production") || "sandbox",
    });
  }, []);

  return null;
}
