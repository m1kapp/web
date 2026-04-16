import { OG, loadPretendard } from "@m1kapp/seo";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const fonts = await loadPretendard([900]);
  return new ImageResponse(
    <OG
      type="icon"
      appName="m1k"
      color="#ec4899"
      bg="blend"
      radius={40}
    />,
    { ...size, fonts }
  );
}
