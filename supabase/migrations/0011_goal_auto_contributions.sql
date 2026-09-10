-- =============================================================================
-- STOKA Finance — aporte automático a una meta (ej. "juntas" quincenales/
-- mensuales con monto y fecha fijos entre familiares/amigos)
--
-- Una "junta" no es ni un gasto puro (el dinero no se pierde, se ahorra y
-- se devuelve, muchas veces con lo que aportan los demás) ni una inversión
-- de mercado — es más parecido a una meta de ahorro con aportes
-- periódicos obligatorios de monto fijo. Se modela como Meta (financial_
-- goals) con un aporte automático configurable, en vez de crear un
-- concepto nuevo — cuando le toca al usuario cobrar el pozo de la junta,
-- lo registra como un ingreso manual (la app no puede saber ese monto de
-- antemano, depende de cuántos participantes haya).
--
-- Deliberadamente separado de recurring_transactions (a diferencia de
-- subscriptions en 0007): un aporte a una meta necesita generar DOS cosas
-- a la vez — el movimiento real en la cuenta (gasto) Y el aporte en
-- goal_contributions (para que la barra de progreso de la meta avance) —
-- y recurring_transactions sólo sabe generar lo primero. Se resuelve con
-- columnas propias + GoalsService.catchUpContributions (mismo patrón
-- "catch-up al abrir la app", sin cron).
-- =============================================================================

alter table public.financial_goals
  add column contribution_amount numeric(14, 2) check (contribution_amount is null or contribution_amount > 0),
  add column contribution_frequency text
    check (contribution_frequency is null or contribution_frequency in ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL')),
  add column contribution_account_id uuid references public.accounts (id),
  add column contribution_category_id uuid references public.categories (id) on delete set null,
  add column next_contribution_date date;

comment on column public.financial_goals.contribution_amount is
  'Si no es null, esta meta tiene aporte automático configurado — se registra solo cada ciclo (gasto real desde contribution_account_id + fila en goal_contributions) vía GoalsService.catchUpContributions. Null = meta sin aporte automático, se contribuye manualmente (comportamiento original).';
