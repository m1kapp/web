import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          borderRadius: 7,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 900,
            color: "#ffffff",
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "-0.5px",
          }}
        >
          m1k
        </span>
      </div>
    ),
    size
  );
}
