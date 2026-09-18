import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f3ebe1",
          color: "#2b1a14",
          fontSize: 78,
          fontWeight: 600,
        }}
      >
        24
      </div>
    ),
    size,
  );
}
