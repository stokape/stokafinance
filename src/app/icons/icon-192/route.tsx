import { ImageResponse } from "next/og";

/** Ícono PWA 192x192 para manifest.webmanifest — gradiente de marca STOKA Finance. */
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
          background: "linear-gradient(135deg, #00C8A3 0%, #008F75 100%)",
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
