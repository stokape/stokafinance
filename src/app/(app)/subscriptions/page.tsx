import type { Metadata } from "next";
import { PlannedFeature } from "@/components/feedback/planned-feature";

export const metadata: Metadata = { title: "Suscripciones" };

export default function SubscriptionsPage() {
  return <PlannedFeature title="Suscripciones" phase="la Fase 5 del roadmap (Control)" />;
}
