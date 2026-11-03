// `npx m1kkit pwa --bg=#ffffff --dark=#09090b` 출력을 Next에 옮긴 것 — public/splash와 짝이다.

/** [CSS 너비, CSS 높이, 픽셀 배율] — 아이폰 세로 스플래시 13종 */
const IPHONES = [
  [440, 956, 3],
  [402, 874, 3],
  [420, 912, 3],
  [430, 932, 3],
  [393, 852, 3],
  [428, 926, 3],
  [390, 844, 3],
  [375, 812, 3],
  [414, 896, 3],
  [414, 896, 2],
  [414, 736, 3],
  [375, 667, 2],
  [320, 568, 2],
] as const;

export const STARTUP_IMAGES = (["light", "dark"] as const).flatMap((scheme) =>
  IPHONES.map(([w, h, dpr]) => ({
    url: `/splash/${scheme === "dark" ? "dark/" : ""}${w * dpr}x${h * dpr}.png`,
    media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait) and (prefers-color-scheme: ${scheme})`,
  })),
);

/** 서비스워커 등록 + 켜 둔 홈 화면 앱의 새 배포 감지. localhost에선 등록하지 않는다 */
export const SW_SCRIPT = `if ("serviceWorker" in navigator && !/^(localhost|127\\.|\\[::1\\])/.test(location.hostname)) {
  navigator.serviceWorker.register("/sw.js");
  let mine = [], checked = Date.now();
  addEventListener("DOMContentLoaded", () => { mine = [...document.scripts].map((s) => s.getAttribute("src")).filter((s) => s && s[0] === "/"); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden || Date.now() - checked < 18e5) return;
    checked = Date.now();
    fetch(location.pathname, { cache: "no-store" }).then((r) => (r.ok ? r.text() : ""))
      .then((html) => { if (html && mine.some((s) => !html.includes(s))) location.reload(); }, () => {});
  });
}`;
