import { ImageResponse } from "next/og";

/** Variante "maskable" (con margen de seguridad) para Android adaptive icons — gradiente de marca STOKA Finance. */
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
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "60%",
            height: "60%",
            color: "#ffffff",
            fontSize: 168,
            fontWeight: 700,
            fontFamily: "sans-serif",
          }}
        >
          S
        </div>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
