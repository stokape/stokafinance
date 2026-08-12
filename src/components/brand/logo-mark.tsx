/**
 * Isotipo de STOKA Finance — la "S" en badge con gradiente de marca.
 *
 * Versión SVG simplificada, construida a partir de la paleta oficial
 * (#00C8A3 verde principal, #008F75 verde secundario, #E6E9EE plata
 * metálica) — no es un trazo del render 3D del board de marca (eso no
 * escala bien a favicon/16px), sino una interpretación plana pensada para
 * verse nítida en cualquier tamaño, desde 16px hasta el ícono de la PWA.
 * El triángulo plateado en la esquina evita que quede plano — referencia
 * directa al "facetado" del isotipo original.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="STOKA Finance"
    >
      <defs>
        <linearGradient id="stoka-mark-bg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00C8A3" />
          <stop offset="1" stopColor="#008F75" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#stoka-mark-bg)" />
      <path d="M32 0V11L21 0H32Z" fill="#E6E9EE" fillOpacity="0.35" />
      <path
        d="M20.5 10.2c-1.1-.85-2.55-1.3-4.1-1.3-3.05 0-4.9 1.35-4.9 3.55 0 2.05 1.55 2.85 4.4 3.35l1.2.2c1.5.25 2.15.6 2.15 1.35 0 .85-.9 1.35-2.35 1.35-1.5 0-2.75-.5-3.6-1.4l-1.75 1.55c1.15 1.3 3.05 2.05 5.25 2.05 3.25 0 5.2-1.45 5.2-3.75 0-2.05-1.4-2.95-4.35-3.45l-1.2-.2c-1.55-.25-2.2-.55-2.2-1.3 0-.75.85-1.2 2.1-1.2 1.2 0 2.25.4 3.05 1.15l1.6-1.9Z"
        fill="#ffffff"
      />
    </svg>
  );
}
