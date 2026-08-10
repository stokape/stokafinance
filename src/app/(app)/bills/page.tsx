import type { Metadata } from "next";
import { PlannedFeature } from "@/components/feedback/planned-feature";

export const metadata: Metadata = { title: "Pagos" };

export default function BillsPage() {
  return <PlannedFeature title="Pagos pendientes" phase="la Fase 5 del roadmap (Control)" />;
}
