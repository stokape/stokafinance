import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/config/app";

/**
 * Manifest PWA (§41). Instalable en desktop/iOS/Android. No implementa
 * estrategia offline financiera compleja en el MVP — sólo instalación e
 * ícono, tal como pide el prompt.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${appConfig.name} — ${appConfig.tagline}`,
    short_name: appConfig.name,
    description: "Control integral de tus finanzas personales.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a0d14",
    theme_color: "#00C8A3",
    icons: [
      { src: "/icons/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-icon-512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
