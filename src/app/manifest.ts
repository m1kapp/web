import { createManifest } from "@m1kapp/kit/pwa";

export default createManifest({
  name: "m1k — 방문자 1,000명을 향한 첫걸음",
  shortName: "m1k",
  description: "배지 하나로 방문자 추적. 1,000명 목표 달성까지의 여정을 한눈에.",
  themeColor: "#0f172a",
  backgroundColor: "#ffffff",
  icon: { text: "m1k", bg: "#0f172a", radius: 0.25 },
});
