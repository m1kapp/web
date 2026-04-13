"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { MyTab } from "@/components/tabs/my-tab";
import { useAppTheme } from "../theme-context";
import type { RecentSite } from "@/lib/types";

export default function MyPage() {
  const { bgColor } = useAppTheme();
  const { isSignedIn } = useUser();
  const [mySites, setMySites] = useState<RecentSite[]>([]);

  function fetchMySites() {
    fetch("/api/sites/mine")
      .then(r => r.json())
      .then(data => setMySites(Array.isArray(data) ? data : []))
      .catch(() => {});
  }

  useEffect(() => {
    if (isSignedIn) fetchMySites();
  }, [isSignedIn]);

  return (
    <MyTab
      sites={mySites}
      isSignedIn={!!isSignedIn}
      bgColor={bgColor}
      onRegistered={fetchMySites}
    />
  );
}
