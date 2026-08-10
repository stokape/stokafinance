import type { Metadata } from "next";
import { PlannedFeature } from "@/components/feedback/planned-feature";

export const metadata: Metadata = { title: "Reportes" };

export default function ReportsPage() {
  return (
    <PlannedFeature
      title="Reportes"
      phase="la Fase 7 del roadmap (Automatización)"
      description="El Dashboard ya muestra ingresos vs gastos y gastos por categoría con datos reales. Este módulo agregará filtros avanzados y exportación a CSV/Excel/PDF."
    />
  );
}
