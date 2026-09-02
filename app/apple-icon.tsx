import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "#111111",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: "26px 26px",
          gap: 9,
        }}
      >
        {[
          { color: "#F0997B", height: 48 },
          { color: "#EF9F27", height: 70 },
          { color: "#1D9E75", height: 100 },
          { color: "#378ADD", height: 86 },
        ].map((bar, i) => (
          <div
            key={i}
            style={{
              width: 20,
              height: bar.height,
              borderRadius: 7,
              background: bar.color,
            }}
          />
        ))}
      </div>
    ),
    { width: 180, height: 180 },
  );
}
