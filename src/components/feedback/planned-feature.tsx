import { Construction } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";

interface PlannedFeatureProps {
  title: string;
  phase: string;
  description?: string;
}

/**
 * Placeholder honesto para módulos que ya tienen modelo de datos (ver
 * supabase/migrations) pero cuya UI/servicio todavía no se construye — nunca
 * se simula con datos falsos (§60). El roadmap real vive en
 * docs/architecture.md §7.
 */
export function PlannedFeature({ title, phase, description }: PlannedFeatureProps) {
  return (
    <EmptyState
      icon={Construction}
      title={`${title} — en construcción`}
      description={description ?? `Este módulo está planificado para ${phase}. El modelo de datos ya existe; falta conectar la UI y los servicios.`}
      className="min-h-[50vh]"
    />
  );
}
