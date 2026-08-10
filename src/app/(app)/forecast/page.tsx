import type { Metadata } from "next";
import { PlannedFeature } from "@/components/feedback/planned-feature";

export const metadata: Metadata = { title: "Proyecciones" };

export default function ForecastPage() {
  return (
    <PlannedFeature
      title="Proyección de caja"
      phase="la Fase 6 del roadmap (Planificación)"
      description="El motor de forecast (lib/financial-engine/forecast.ts) ya está implementado y probado. Falta conectar bills/tarjetas/préstamos como fuentes de eventos futuros y construir esta pantalla."
    />
  );
}
