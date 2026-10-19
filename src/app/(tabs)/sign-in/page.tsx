"use client";

import { useEffect } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import { SignInScreen, useSocialSignIn } from "@m1kapp/auth";
import { useSearchParams, useRouter } from "next/navigation";
import { getAuthRedirectUrls } from "@/lib/auth-redirect";

export default function SignInPage() {
  const { isSignedIn, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const signIn = useSocialSignIn(useClerk(), getAuthRedirectUrls());
  const redirect = searchParams.get("redirect") || "/my";

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // 이미 로그인 상태면 redirect로 이동
      if (redirect.startsWith("http")) {
        window.location.href = redirect;
      } else {
        router.replace(redirect);
      }
    }
  }, [isLoaded, isSignedIn, redirect, router]);

  if (!isLoaded || isSignedIn) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 rounded-full border-2 border-zinc-300 border-t-zinc-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <SignInScreen
        className="flex-1"
        color="#09090b"
        icon="/icon-512.png"
        name="m1k"
        slogan="방문자 1,000명을 향한 첫걸음"
        title="하나의 계정으로."
        text="m1k의 모든 앱을 같은 계정으로 써요."
        ways={["kakao", "google", "github"]}
        signIn={signIn}
      />
    </div>
  );
}
