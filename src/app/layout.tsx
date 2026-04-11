import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import { ClerkProvider } from "@clerk/nextjs";
import { PaddleProvider } from "@/components/paddle-provider";
import { fontFamily, ThemeScript } from "@m1kapp/ui";
import { db } from "@/lib/db";
import { sites } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import "./globals.css";

const pretendard = localFont({
  src: "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
});

export const metadata: Metadata = {
  title: "m1k — 방문자 1,000명을 향한 첫걸음",
  description: "배지 하나로 방문자 추적. 1,000명 목표 달성까지의 여정을 한눈에.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%230f172a'/><text x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' font-family='system-ui,sans-serif' font-size='14' font-weight='900' fill='white'>m1k</text></svg>",
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

  const self = await db.query.sites.findFirst({
    where: eq(sites.url, "https://m1k.app"),
    columns: { slug: true },
  });

  return (
    <html
      lang="ko"
      className={`${pretendard.variable} h-full antialiased${isDark ? " dark" : ""}`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/toss/tossface/dist/tossface.css"
        />
      </head>
      <body className="min-h-full" style={{ fontFamily: fontFamily.pretendard }} data-self-slug={self?.slug ?? ""}>
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
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
