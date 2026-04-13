import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "탐색 — m1k",
  description: "다른 사람들의 미니 프로젝트를 둘러보고 응원해보세요.",
  openGraph: {
    title: "탐색 — m1k",
    description: "다른 사람들의 미니 프로젝트를 둘러보고 응원해보세요.",
    url: "https://m1k.app/store",
    siteName: "m1k",
    locale: "ko_KR",
    type: "website",
  },
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
