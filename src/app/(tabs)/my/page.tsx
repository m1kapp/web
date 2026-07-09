"use client";

import { SiteCardSkeleton } from "@/components/site-card";
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
      <div className="px-4 pt-2 pb-24 animate-pulse">
        <div className="flex items-center gap-3 mb-5 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <div className="space-y-1.5">
              <div className="h-5 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-3 w-40 rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
        </div>
        <div className="flex gap-1 mb-5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl">
          <div className="flex-1 py-1.5 rounded-lg bg-white dark:bg-zinc-950 h-8" />
          <div className="flex-1 py-1.5 rounded-lg h-8" />
        </div>
        <SiteCardSkeleton count={3} />
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
