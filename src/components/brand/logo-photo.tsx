import { cn } from "@/lib/utils/cn";

/**
 * Isotipo real de STOKA Finance (public/brand/*.jpg — provisto por el
 * usuario, no una interpretación). Cambia entre versión clara/oscura según
 * el tema vía CSS puro (ver globals.css, clases .brand-logo-light/dark) —
 * nunca vía JS, para no depender de hidratación ni parpadear en el primer
 * render.
 *
 * Usado en placements grandes donde el detalle se aprecia (sidebar, header
 * de login/registro). El favicon/íconos PWA siguen con el badge SVG
 * simplificado (src/app/icon.tsx y hermanos) — a 16-32px el detalle del
 * origami se pierde igual, es una limitación de tamaño, no de fidelidad.
 */
export function LogoPhoto({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("relative inline-block shrink-0 overflow-hidden rounded-lg", className)} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- assets fijos pequeños, no ameritan el pipeline de next/image */}
      <img
        src="/brand/logo_fondo_claro.jpg"
        alt="STOKA Finance"
        className="brand-logo-light absolute inset-0 h-full w-full object-cover"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- ídem */}
      <img
        src="/brand/logo_fondo_oscuro.jpg"
        alt="STOKA Finance"
        className="brand-logo-dark absolute inset-0 h-full w-full object-cover"
      />
    </span>
  );
}
