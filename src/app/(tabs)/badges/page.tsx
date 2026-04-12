"use client";

import { BadgeWorldTab } from "@/components/tabs/badge-world-tab";
import { useAppTheme } from "../theme-context";

export default function BadgesPage() {
  const { bgColor } = useAppTheme();
  return <BadgeWorldTab bgColor={bgColor} />;
}
