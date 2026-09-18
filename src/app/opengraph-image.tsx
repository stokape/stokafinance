import { ImageResponse } from "next/og";
import { appConfig } from "@/lib/config/app";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${appConfig.name} — ${appConfig.tagline}`;

/**
 * Imagen de vista previa social (WhatsApp, Twitter/X, LinkedIn, resultados
 * de búsqueda) para "/", generada en build/request time sin assets externos
 * — mismo patrón que icon.tsx/apple-icon.tsx. Antes no existía ninguna: el
 * link de STOKA se compartía sin imagen. Paleta de marca (#00C8A3 → #008F75
 * sobre fondo oscuro #0a0d14, igual que el theme-color del manifest).
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0a0d14",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 88,
            height: 88,
            borderRadius: 20,
            background: "linear-gradient(135deg, #00C8A3 0%, #008F75 100%)",
            color: "#ffffff",
            fontSize: 44,
            fontWeight: 700,
            marginBottom: 48,
          }}
        >
          S
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 60,
            fontWeight: 700,
            lineHeight: 1.15,
            color: "#ffffff",
            maxWidth: 980,
          }}
        >
          Tu dinero no necesita más pestañas. Necesita dirección.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "#9aa3af",
            marginTop: 28,
            maxWidth: 860,
          }}
        >
          Cuentas, presupuestos, deudas y metas trabajando juntas — {appConfig.name}
        </div>
      </div>
    ),
    size,
  );
}
