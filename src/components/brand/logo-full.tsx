import { LogoMark } from "@/components/brand/logo-mark";
import { cn } from "@/lib/utils/cn";

/**
 * Lockup horizontal completo: isotipo + wordmark "STOKA" (adapta al tema,
 * como el resto de la UI) + "FINANCE" (verde de marca fijo, #00C8A3 —
 * el mismo tratamiento a dos tonos del board de marca). El tagline es
 * opcional: se usa en pantallas de login/registro, no en el header
 * (ahí sería ruido — el sidebar ya es angosto).
 */
export function LogoFull({
  size = 32,
  tagline = false,
  className,
}: {
  size?: number;
  tagline?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <div className="flex flex-col leading-none">
        <span className="flex items-baseline gap-1 font-semibold tracking-tight" style={{ fontSize: size * 0.5 }}>
          <span className="text-foreground">STOKA</span>
          <span style={{ color: "#00C8A3" }}>FINANCE</span>
        </span>
        {tagline ? (
          <span className="mt-0.5 text-xs text-muted-foreground">Control financiero personal</span>
        ) : null}
      </div>
    </div>
  );
}
