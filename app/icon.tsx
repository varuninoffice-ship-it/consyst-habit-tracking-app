import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          borderRadius: 44,
          background: "#111111",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: "28px 28px",
          gap: 10,
        }}
      >
        {[
          { color: "#F0997B", height: 52 },
          { color: "#EF9F27", height: 76 },
          { color: "#1D9E75", height: 108 },
          { color: "#378ADD", height: 92 },
        ].map((bar, i) => (
          <div
            key={i}
            style={{
              width: 22,
              height: bar.height,
              borderRadius: 8,
              background: bar.color,
            }}
          />
        ))}
      </div>
    ),
    { width: 192, height: 192 },
  );
}
