-- =============================================================================
-- STOKA Finance — tipo de pago del préstamo (capital+interés vs solo interés)
--
-- Hasta ahora todo préstamo se amortizaba con el sistema francés (cuota
-- fija, capital+interés, calculada automáticamente desde la tasa). Muchos
-- préstamos informales/familiares en la práctica son "solo interés": se
-- paga el interés cada período y el capital completo al final (bullet/
-- interest-only) — común en préstamos entre familiares o de montos chicos.
-- =============================================================================

alter table public.loans
  add column payment_type text not null default 'PRINCIPAL_AND_INTEREST'
    check (payment_type in ('PRINCIPAL_AND_INTEREST', 'INTEREST_ONLY'));

comment on column public.loans.payment_type is
  'PRINCIPAL_AND_INTEREST: cuota fija con capital+interés (sistema francés, comportamiento original). INTEREST_ONLY: cada cuota es sólo interés sobre el capital original (que no baja) y la última cuota agrega el capital completo (bullet payment) — típico de préstamos informales/familiares.';
