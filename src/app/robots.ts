import type { MetadataRoute } from "next";

// finance.stoka.pe no tiene contenido público: "/" redirige directo a
// /login o /dashboard, y ambos requieren cuenta. No hay nada que un
// buscador deba indexar aquí, así que se excluye el sitio entero.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
