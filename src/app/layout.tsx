import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import { ClerkProvider } from "@clerk/nextjs";
import { PaddleProvider } from "@/components/paddle-provider";
import { THEME_SCRIPT, ToastProvider } from "@m1kapp/kit";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import "./globals.css";

// Inlined to prevent FOUC before the external stylesheet loads
const CRITICAL_CSS = `
:root{--background:oklch(1 0 0);--foreground:oklch(0.145 0 0);--border:oklch(0.922 0 0);--ring:oklch(0.708 0 0);--radius:0.625rem;--card:oklch(1 0 0);--muted:oklch(0.97 0 0);--accent:oklch(0.97 0 0)}
.dark{--background:oklch(0.145 0 0);--foreground:oklch(0.985 0 0);--border:oklch(1 0 0/10%);--ring:oklch(0.556 0 0);--card:oklch(0.205 0 0);--muted:oklch(0.269 0 0);--accent:oklch(0.269 0 0)}
body{margin:0;background-color:var(--background);color:var(--foreground)}
`.trim();

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "optional",
  weight: "45 920",
});

const getSelfSlug = unstable_cache(
  () => db.query.sites.findFirst({ where: eq(sites.url, "https://m1k.app"), columns: { slug: true } }),
  ["self-slug"],
  { revalidate: false },
);

export { mobileViewport as viewport } from "@m1kapp/kit/pwa";

export const metadata: Metadata = {
  title: "m1k — 방문자 1,000명을 향한 첫걸음",
  description: "배지 하나로 방문자 추적. 1,000명 목표 달성까지의 여정을 한눈에.",
  openGraph: {
    title: "m1k — 방문자 1,000명을 향한 첫걸음",
    description: "배지 하나로 방문자 추적. 1,000명 목표 달성까지의 여정을 한눈에.",
    url: "https://m1k.app",
    siteName: "m1k",
    locale: "ko_KR",
    type: "website",
    images: [{ url: "https://m1k.app/og", width: 1200, height: 630, alt: "m1k" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "m1k — 방문자 1,000명을 향한 첫걸음",
    description: "배지 하나로 방문자 추적. 1,000명 목표 달성까지의 여정을 한눈에.",
    images: ["https://m1k.app/og"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value ?? "light";
  const isDark = theme !== "light";

  const self = await getSelfSlug();

  return (
    <html
      lang="ko"
      className={`${pretendard.variable} h-full antialiased${isDark ? " dark" : ""}`}
      suppressHydrationWarning
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/toss/tossface/dist/tossface.css"
        />
      </head>
      <body className="min-h-full h-dvh" style={{ fontFamily: 'var(--font-pretendard), system-ui, sans-serif' }} data-self-slug={self?.slug ?? ""}>
        <ClerkProvider
          appearance={{
            layout: {
              unsafe_disableDevelopmentModeWarnings: true,
            },
            variables: {
              colorBackground: "#ffffff",
              colorText: "#09090b",
              colorInputBackground: "#f4f4f5",
              colorInputText: "#09090b",
            },
            elements: {
              footer: { display: "none" },
              footerAction: { display: "none" },
              footerActionText: { display: "none" },
              footerActionLink: { display: "none" },
              footerItem: { display: "none" },
              footerPagesLink: { display: "none" },
            },
          }}
        >
          <PaddleProvider />
          <ToastProvider>
            {children}
          </ToastProvider>
          <SpeedInsights />
        </ClerkProvider>
      </body>
    </html>
  );
}
