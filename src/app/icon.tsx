import { ImageResponse } from "next/og";
import { OG, loadPretendard } from "@m1kapp/seo";

export const dynamic = "force-dynamic";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const fonts = await loadPretendard([900]);
  return new ImageResponse(
    <OG type="icon" appName="m1k" color="#0f172a" radius={7} />,
    { ...size, fonts },
  );
}
