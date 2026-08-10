import type { Metadata } from "next";
import { PlannedFeature } from "@/components/feedback/planned-feature";

export const metadata: Metadata = { title: "Presupuesto" };

export default function BudgetsPage() {
  return <PlannedFeature title="Presupuesto" phase="la Fase 5 del roadmap (Control)" />;
}
