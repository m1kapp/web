"use client";

import { StoreTab } from "@/components/tabs/store-tab";
import { useAppTheme } from "../theme-context";

export default function StorePage() {
  const { bgColor } = useAppTheme();
  return <StoreTab bgColor={bgColor} />;
}
