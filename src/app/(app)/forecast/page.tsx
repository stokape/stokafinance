import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ForecastService } from "@/features/forecast/services/forecast.service";
import { HorizonSelector } from "@/features/forecast/components/horizon-selector";
import { ForecastChart } from "@/features/forecast/components/lazy-forecast-chart";
import { NegativeBalanceAlert } from "@/features/forecast/components/negative-balance-alert";
import { EventsTimeline } from "@/features/forecast/components/events-timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils/money";

export const metadata: Metadata = { title: "Proyecciones" };

const VALID_HORIZONS = [7, 15, 30, 60, 90];

interface ForecastPageProps {
  searchParams: Promise<{ days?: string }>;
}

export default async function ForecastPage({ searchParams }: ForecastPageProps) {
  const params = await searchParams;
  const requestedDays = Number(params.days);
  const horizonDays = VALID_HORIZONS.includes(requestedDays) ? requestedDays : 30;

  const supabase = await createSupabaseServerClient();
  const forecast = await new ForecastService(supabase).getForecast(horizonDays);

  // Los valores Decimal no cruzan el límite Server → Client Component
  // serializados; se convierten a primitivos antes de pasarlos al gráfico.
  const chartPoints = forecast.days.map((day) => ({ date: day.date, projectedBalance: day.projectedBalance.toNumber() }));
  const allEvents = forecast.days.flatMap((day) => day.events);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Proyección de caja</h1>
          <p className="text-sm text-muted-foreground">Saldo actual + pagos, cuotas y suscripciones conocidos en el horizonte elegido.</p>
        </div>
        <HorizonSelector current={horizonDays} />
      </div>

      <NegativeBalanceAlert negativeDates={forecast.negativeDates} lowestBalance={forecast.lowestBalance.toNumber()} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Saldo actual</p>
            <p className="text-lg font-semibold">{formatMoney(forecast.startingBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Saldo proyectado (día {horizonDays})</p>
            <p className="text-lg font-semibold">{formatMoney(forecast.endingBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Saldo mínimo proyectado</p>
            <p className={forecast.lowestBalance.isNegative() ? "text-lg font-semibold text-danger" : "text-lg font-semibold"}>
              {formatMoney(forecast.lowestBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolución del saldo</CardTitle>
        </CardHeader>
        <CardContent>
          <ForecastChart points={chartPoints} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eventos proyectados</CardTitle>
        </CardHeader>
        <CardContent>
          <EventsTimeline events={allEvents} />
        </CardContent>
      </Card>

    </div>
  );
}
