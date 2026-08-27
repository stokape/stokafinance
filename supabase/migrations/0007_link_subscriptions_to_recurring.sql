-- =============================================================================
-- STOKA Finance — conecta Suscripciones con Recurrentes
--
-- Hasta ahora eran dos módulos paralelos sin relación: `subscriptions` es
-- puramente informativo (muestra cuánto te cuestan tus servicios al mes/año)
-- y `recurring_transactions` es el que efectivamente genera un gasto real
-- cada vez que se cumple la fecha (patrón "catch-up al abrir la app", sin
-- cron — ver RecurringTransactionsService.listAndCatchUp).
--
-- Esta columna permite que una suscripción, si el usuario lo pide al
-- crearla, genere y quede enlazada a su propia recurrencia — así aparece en
-- el resumen de "Suscripciones" Y se registra sola como gasto en
-- Transacciones, sin tener que darla de alta dos veces.
-- =============================================================================

alter table public.subscriptions
  add column recurring_transaction_id uuid references public.recurring_transactions (id) on delete set null;

comment on column public.subscriptions.recurring_transaction_id is
  'Si no es null, esta suscripción genera automáticamente su gasto real cada ciclo a través de este recurring_transactions vinculado. Null = solo informativa (comportamiento original, antes de esta migración).';
