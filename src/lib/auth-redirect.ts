function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getAuthRedirectUrls() {
  const configuredBase =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_APP_URL : undefined;
  const runtimeBase =
    typeof window !== "undefined" ? window.location.origin : undefined;
  const base = trimTrailingSlash(configuredBase || runtimeBase || "https://m1k.app");

  // /sign-in?redirect=... 파라미터가 있으면 로그인 완료 후 그곳으로 이동
  const redirectParam =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("redirect")
      : null;
  const redirectUrlComplete = redirectParam || `${base}/`;

  return {
    redirectUrl: `${base}/sso-callback`,
    redirectUrlComplete,
  };
}
