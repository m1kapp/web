import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "프로필 — m1k",
  description: "내 사이트와 응원한 도전을 한곳에서 확인하세요.",
  openGraph: {
    title: "프로필 — m1k",
    description: "내 사이트와 응원한 도전을 한곳에서 확인하세요.",
    url: "https://m1k.app/my",
    siteName: "m1k",
    locale: "ko_KR",
    type: "website",
  },
};

export default function MyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
