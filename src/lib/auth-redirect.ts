function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function getAuthRedirectUrls() {
  const configuredBase =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_APP_URL : undefined;
  const runtimeBase =
    typeof window !== "undefined" ? window.location.origin : undefined;
  const base = trimTrailingSlash(configuredBase || runtimeBase || "https://m1k.app");

  return {
    redirectUrl: `${base}/sso-callback`,
    redirectUrlComplete: `${base}/`,
  };
}
