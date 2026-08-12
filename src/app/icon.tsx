import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Ícono generado en build/request time (sin assets externos, costo cero).
 * Next.js expone esto automáticamente como favicon. Gradiente de marca
 * (§ paleta STOKA Finance: #00C8A3 → #008F75).
 */
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
          background: "linear-gradient(135deg, #00C8A3 0%, #008F75 100%)",
          borderRadius: 6,
          color: "#ffffff",
          fontSize: 20,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        S
      </div>
    ),
    size,
  );
}
