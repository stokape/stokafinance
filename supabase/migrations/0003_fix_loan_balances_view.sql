-- =============================================================================
-- Corrige loan_balances: debía partir de original_amount igual que
-- account_balances parte de initial_balance. Tal como quedó definida en
-- 0001_init.sql, la vista sumaba únicamente los ledger_entries del
-- préstamo — como STOKA Finance no registra un LOAN_DISBURSEMENT al crear
-- un préstamo (se asume dinero ya recibido/gastado fuera de la app, ver
-- LoansService.createLoan), el saldo quedaba en 0 hasta el primer pago en
-- vez de en original_amount. Los LOAN_PAYMENT sí generan ledger_entries
-- negativos por el componente de capital, así que sumarlos a
-- original_amount es correcto.
-- =============================================================================

drop view if exists public.loan_balances;

create view public.loan_balances as
select
  l.id as loan_id,
  l.user_id,
  l.original_amount,
  l.original_amount + coalesce(sum(le.amount), 0) as current_balance
from public.loans l
left join public.ledger_entries le on le.target_type = 'LOAN' and le.target_id = l.id
group by l.id, l.user_id, l.original_amount;
