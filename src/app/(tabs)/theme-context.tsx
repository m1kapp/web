"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface ThemeCtxValue {
  bgColor: string;
  setBgColor: (color: string) => void;
}

const ThemeCtx = createContext<ThemeCtxValue>({ bgColor: "#0f172a", setBgColor: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [bgColor, setBgColor] = useState("#0f172a");
  return <ThemeCtx.Provider value={{ bgColor, setBgColor }}>{children}</ThemeCtx.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeCtx);
}
