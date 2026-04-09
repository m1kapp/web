import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from "@clerk/nextjs";
import { PaddleProvider } from "@/components/paddle-provider";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/toss/tossface/dist/tossface.css"
        />
      </head>
      <body className="min-h-full font-[family-name:var(--font-pretendard),Tossface,system-ui,sans-serif]">
        <ClerkProvider
          appearance={{
            layout: {
              unsafe_disableDevelopmentModeWarnings: true,
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
