"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { MyTab } from "@/components/tabs/my-tab";
import { useAppTheme } from "../theme-context";
import { useFetch } from "@m1kapp/kit";
import type { RecentSite } from "@/lib/types";

export default function MyPage() {
  const { bgColor } = useAppTheme();
  const { isSignedIn, isLoaded } = useUser();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (isLoaded) return;
    const id = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(id);
  }, [isLoaded]);

  const { data: mySitesData, loading: sitesLoading, refetch } = useFetch<RecentSite[]>(
    isSignedIn ? "/api/sites/mine" : null
  );
  const mySites = Array.isArray(mySitesData) ? mySitesData : [];

  if (!isLoaded && !timedOut) {
    return (
      <div className="p-4 space-y-4 animate-pulse">
        <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-4 w-1/3 rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <MyTab
      sites={mySites}
      isSignedIn={!!isSignedIn}
      bgColor={bgColor}
      onRegistered={refetch}
      sitesLoading={sitesLoading}
    />
  );
}
