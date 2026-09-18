import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
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
          background: "#f3ebe1",
          color: "#2b1a14",
          fontSize: 220,
          fontWeight: 600,
        }}
      >
        24
      </div>
    ),
    size,
  );
}
