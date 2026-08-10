import { ImageResponse } from "next/og";

/** Variante "maskable" (con margen de seguridad) para Android adaptive icons. */
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
