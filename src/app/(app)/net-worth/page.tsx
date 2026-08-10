import type { Metadata } from "next";
import { PlannedFeature } from "@/components/feedback/planned-feature";

export const metadata: Metadata = { title: "Patrimonio" };

export default function NetWorthPage() {
  return (
    <PlannedFeature
      title="Patrimonio"
      phase="la Fase 6 del roadmap (Planificación)"
      description="El saldo consolidado de tus cuentas ya se calcula en el Dashboard. Este módulo agregará activos/pasivos manuales (propiedades, vehículos, hipotecas) y el historial mensual de patrimonio neto."
    />
  );
}
