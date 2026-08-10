import type { Metadata } from "next";
import { PlannedFeature } from "@/components/feedback/planned-feature";

export const metadata: Metadata = { title: "Deudas" };

export default function LoansPage() {
  return <PlannedFeature title="Préstamos y deudas" phase="la Fase 5 del roadmap (Control)" />;
}
