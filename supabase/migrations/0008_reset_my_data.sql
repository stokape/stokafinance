-- =============================================================================
-- STOKA Finance — "Reiniciar mis datos" (empezar de cero, sin perder la cuenta)
--
-- Borra TODO lo financiero del usuario que llama a la función (todas las
-- tablas propias excepto `profiles`) mientras conserva su login/perfil —
-- no tiene que volver a registrarse. Usa `auth.uid()` internamente y NUNCA
-- un id recibido del cliente, para que sea imposible que un usuario borre
-- los datos de otro (mismo patrón que fn_check_rate_limit/handle_new_user).
--
-- Es SECURITY DEFINER porque dos tablas (`ledger_entries`, `audit_logs`)
-- están deliberadamente bloqueadas para authenticated — sólo las escriben
-- triggers/funciones SECURITY DEFINER (ver sus comentarios en
-- 0001_init.sql) — así que un usuario normal no podría borrar sus propias
-- filas ahí ni con RLS a favor. El resto de tablas sí tienen policy de
-- "delete own", pero se centraliza todo en una función para que sea una
-- sola transacción atómica (si algo falla a mitad de camino, no queda un
-- borrado parcial).
--
-- El orden de los DELETE respeta las foreign keys `on delete restrict`
-- reales del esquema (ej. transactions.account_id es RESTRICT, así que
-- transactions se borra antes que accounts) — no es un orden arbitrario,
-- ver docs/database.md para el mapa de relaciones si se audita esto luego.
-- =============================================================================

create or replace function public.fn_reset_my_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'No autenticado';
  end if;

  -- Hijos primero (ledger_entries/credit_card_installment_plans son
  -- cascade de transactions/credit_card_transactions, se listan explícitos
  -- de todas formas para que quede auditable qué se borra).
  delete from public.ledger_entries where user_id = v_user_id;
  delete from public.transactions where user_id = v_user_id;

  delete from public.credit_card_installment_plans where user_id = v_user_id;
  delete from public.credit_card_transactions where user_id = v_user_id;
  delete from public.credit_card_statements where user_id = v_user_id;

  delete from public.loan_installments where user_id = v_user_id;

  delete from public.recurring_transactions where user_id = v_user_id;
  delete from public.bills where user_id = v_user_id;
  delete from public.subscriptions where user_id = v_user_id;
  delete from public.import_batches where user_id = v_user_id;

  delete from public.goal_contributions where user_id = v_user_id;
  delete from public.financial_goals where user_id = v_user_id;

  delete from public.assets where user_id = v_user_id;
  delete from public.liabilities where user_id = v_user_id;

  delete from public.budget_categories where user_id = v_user_id;
  delete from public.budgets where user_id = v_user_id;

  -- Padres: recién ahora es seguro borrarlos (nada los referencia ya con RESTRICT).
  delete from public.credit_cards where user_id = v_user_id;
  delete from public.loans where user_id = v_user_id;
  delete from public.accounts where user_id = v_user_id;

  -- Categorías/subcategorías propias (nunca las del sistema: is_system=false
  -- ya está implícito porque las del sistema tienen user_id null).
  delete from public.subcategories where user_id = v_user_id;
  delete from public.categories where user_id = v_user_id;

  -- Sin relaciones entrantes de otras tablas: orden libre.
  delete from public.financial_snapshots where user_id = v_user_id;
  delete from public.audit_logs where user_id = v_user_id;
  delete from public.whatsapp_connections where user_id = v_user_id;
end;
$$;

comment on function public.fn_reset_my_data is
  'Borra todos los datos financieros del usuario autenticado (auth.uid()), conserva su cuenta/perfil. Invocado desde Configuración → Zona de peligro.';

revoke all on function public.fn_reset_my_data() from public, anon;
grant execute on function public.fn_reset_my_data() to authenticated;
