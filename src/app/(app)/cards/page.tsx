import type { Metadata } from "next";
import { PlannedFeature } from "@/components/feedback/planned-feature";

export const metadata: Metadata = { title: "Tarjetas" };

export default function CardsPage() {
  return <PlannedFeature title="Tarjetas de crédito" phase="la Fase 5 del roadmap (Control)" />;
}
