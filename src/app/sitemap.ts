import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/config/app";

// Única ruta pública indexable hoy (ver robots.ts): la landing comercial.
// El resto de la app exige sesión y queda fuera del sitemap a propósito —
// no hay nada más que un buscador deba descubrir por acá.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: appConfig.url,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
