import type { Metadata } from "next";
import { Target } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GoalsService } from "@/features/goals/services/goals.service";
import { GoalCard } from "@/features/goals/components/goal-card";
import { NewGoalDialog } from "@/features/goals/components/new-goal-dialog";
import { EmptyState } from "@/components/feedback/empty-state";

export const metadata: Metadata = { title: "Metas" };

export default async function GoalsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const goalsService = new GoalsService(supabase);
  // Genera los aportes automáticos vencidos (juntas quincenales/mensuales,
  // etc.) antes de listar — mismo patrón "catch-up al abrir la página" que
  // recurrentes, sin cron. Ver GoalsService.catchUpContributions.
  if (user) await goalsService.catchUpContributions(user.id);
  const goals = await goalsService.listGoals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Metas de ahorro</h1>
          <p className="text-sm text-muted-foreground">Fondo de emergencia, viaje, inicial de vivienda...</p>
        </div>
        <NewGoalDialog />
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Aún no tienes metas"
          description="Crea una meta de ahorro y registra aportes para ver tu progreso."
          action={<NewGoalDialog />}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}
