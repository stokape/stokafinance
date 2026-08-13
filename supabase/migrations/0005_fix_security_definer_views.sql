-- =============================================================================
-- STOKA Finance — Corrige "Security Definer View" en las 4 vistas de saldo
-- (CRÍTICO — hallazgo del linter de seguridad de Supabase, confirmado con
-- fuga de datos real entre usuarios)
--
-- Ninguna de las 4 vistas (account_balances, credit_card_balances,
-- loan_balances, goal_progress) especificaba `security_invoker` al
-- crearse. El default de Postgres para una vista es `security_invoker =
-- false` — la vista se evalúa con los privilegios/contexto de RLS del
-- DUEÑO de la vista (quien corrió la migración, ej. el rol `postgres`),
-- NO del usuario que hace la consulta vía PostgREST. Como ese rol no está
-- sujeto a las policies de RLS de `authenticated`/`anon`, la vista
-- devolvía TODAS las filas de TODOS los usuarios a cualquiera que la
-- consultara — verificado con datos reales: un usuario de prueba pudo ver
-- el saldo de una cuenta de otro usuario completamente ajeno.
--
-- Fix: `security_invoker = true` hace que la vista se evalúe con los
-- privilegios de QUIEN CONSULTA — recién ahí las policies de RLS de las
-- tablas base (accounts, credit_cards, loans, ledger_entries,
-- financial_goals, goal_contributions) se aplican correctamente también a
-- través de la vista. Requiere Postgres 15+.
-- =============================================================================

alter view public.account_balances set (security_invoker = true);
alter view public.credit_card_balances set (security_invoker = true);
alter view public.loan_balances set (security_invoker = true);
alter view public.goal_progress set (security_invoker = true);
