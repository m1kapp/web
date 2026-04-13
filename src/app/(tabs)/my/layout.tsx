import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "마이페이지 — m1k",
  description: "내 사이트를 등록하고 방문자 1,000명 달성을 향해 나아가세요.",
  openGraph: {
    title: "마이페이지 — m1k",
    description: "내 사이트를 등록하고 방문자 1,000명 달성을 향해 나아가세요.",
    url: "https://m1k.app/my",
    siteName: "m1k",
    locale: "ko_KR",
    type: "website",
  },
};

export default function MyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
