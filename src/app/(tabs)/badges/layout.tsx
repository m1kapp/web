import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "배지 월드 — m1k",
  description: "방문자 달성으로 획득할 수 있는 모든 배지를 확인해보세요.",
  openGraph: {
    title: "배지 월드 — m1k",
    description: "방문자 달성으로 획득할 수 있는 모든 배지를 확인해보세요.",
    url: "https://m1k.app/badges",
    siteName: "m1k",
    locale: "ko_KR",
    type: "website",
  },
};

export default function BadgesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
