import { cn } from "@/lib/utils/cn";

/**
 * Wordmark horizontal real de STOKA Finance (public/brand/stoka_finance_*.jpg
 * — provisto por el usuario) — "STOKA FINANCE" + tagline con la tipografía
 * real de marca (Raleway para FINANCE/tagline, tipografía propia para
 * STOKA). Reemplaza un intento anterior en CSS que usaba la fuente por
 * defecto de la app (Geist) y no calzaba con la marca.
 *
 * El fondo de la pieza (gris/negro casi plano) no calza pixel a pixel con
 * `--background` a este tamaño (sí funcionaba en el isotipo pequeño, acá se
 * nota el rectángulo) y el contenido decorativo llega hasta los bordes de
 * la imagen (no hay margen que recortar) — se difumina con una máscara CSS
 * radial en vez de pedir un PNG transparente nuevo.
 *
 * Cambia entre versión clara/oscura vía CSS puro (ver globals.css, clases
 * .brand-logo-light/dark), sin JS ni hydration-mismatch.
 */
const FADE_MASK = "radial-gradient(ellipse 60% 72% at center, black 38%, transparent 82%)";

export function WordmarkPhoto({ width = 220, className }: { width?: number; className?: string }) {
  return (
    <span className={cn("relative inline-block", className)} style={{ width, aspectRatio: "695 / 280" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- asset fijo pequeño, no amerita next/image */}
      <img
        src="/brand/stoka_finance_claro.jpg"
        alt="STOKA Finance — Control financiero personal"
        className="brand-logo-light h-full w-full object-contain"
        style={{ maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- ídem */}
      <img
        src="/brand/stoka_finance_oscuro.jpg"
        alt="STOKA Finance — Control financiero personal"
        className="brand-logo-dark h-full w-full object-contain"
        style={{ maskImage: FADE_MASK, WebkitMaskImage: FADE_MASK }}
      />
    </span>
  );
}
