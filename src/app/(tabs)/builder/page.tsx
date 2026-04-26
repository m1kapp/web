"use client";

import { BuildersTab } from "@/components/tabs/builders-tab";
import { useAppTheme } from "../theme-context";

export default function BuilderPage() {
  const { bgColor } = useAppTheme();
  return <BuildersTab bgColor={bgColor} />;
}
