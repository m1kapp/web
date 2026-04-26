import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "빌더 — m1k",
  description: "나만의 앱 페이지를 만들어보세요.",
};

export default function BuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
