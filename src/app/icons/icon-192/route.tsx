import { ImageResponse } from "next/og";

/** Ícono PWA 192x192 para manifest.webmanifest — generado en runtime, sin assets. */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#3730a3",
          color: "#ffffff",
          fontSize: 104,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        S
      </div>
    ),
    { width: 192, height: 192 },
  );
}
