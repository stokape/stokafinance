import type { Metadata } from "next";
import { PlannedFeature } from "@/components/feedback/planned-feature";

export const metadata: Metadata = { title: "Metas" };

export default function GoalsPage() {
  return <PlannedFeature title="Metas de ahorro" phase="la Fase 6 del roadmap (Planificación)" />;
}
