import { ImageResponse } from "next/og";
import { OGImage, loadPretendard } from "@m1kapp/kit/ogimage";

export const dynamic = "force-static";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const fonts = await loadPretendard([900]).catch(() => []);
  return new ImageResponse(
    <OGImage type="icon" appName="m1k" color="#0f172a" bg="dark" radius={7} fontSize={20} />,
    { ...size, fonts },
  );
}
