-- =============================================================================
-- STOKA Finance — Migración inicial
-- Cubre: extensiones, perfiles, catálogo financiero completo, ledger de doble
-- registro simplificado, RLS por usuario, triggers de integridad y auditoría.
-- Ver docs/database.md y docs/architecture.md para las decisiones de diseño.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Extensiones
-- -----------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Funciones utilitarias genéricas
-- -----------------------------------------------------------------------------

-- Mantiene updated_at sincronizado en cualquier tabla que la use.
create or replace function public.fn_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. profiles — extiende auth.users, 1 fila por usuario
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  currency text not null default 'PEN',
  timezone text not null default 'America/Lima',
  locale text not null default 'es-PE',
  avatar_url text,
  monthly_income_estimate numeric(14, 2),
  primary_goal text,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil de usuario 1:1 con auth.users. Se crea automáticamente vía trigger handle_new_user.';

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_insert_own" on public.profiles for insert with check (id = auth.uid());

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.fn_set_updated_at();

-- Crea el perfil automáticamente cuando Supabase Auth crea un usuario.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, currency, timezone, locale)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'currency', 'PEN'),
    coalesce(new.raw_user_meta_data ->> 'timezone', 'America/Lima'),
    coalesce(new.raw_user_meta_data ->> 'locale', 'es-PE')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 3. accounts
-- -----------------------------------------------------------------------------
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  institution text,
  account_type text not null check (account_type in ('CASH', 'CHECKING', 'SAVINGS', 'DIGITAL_WALLET', 'INVESTMENT', 'OTHER')),
  currency text not null default 'PEN',
  initial_balance numeric(14, 2) not null default 0,
  icon text,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.accounts is 'Cuentas financieras del usuario. current_balance NO se materializa aquí: se calcula desde ledger_entries (ver vista account_balances). Decisión documentada en docs/database.md.';

create index idx_accounts_user_id on public.accounts (user_id);

alter table public.accounts enable row level security;

create policy "accounts_select_own" on public.accounts for select using (user_id = auth.uid());
create policy "accounts_insert_own" on public.accounts for insert with check (user_id = auth.uid());
create policy "accounts_update_own" on public.accounts for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "accounts_delete_own" on public.accounts for delete using (user_id = auth.uid());

create trigger trg_accounts_updated_at before update on public.accounts
  for each row execute function public.fn_set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. categories / subcategories
-- -----------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  category_type text not null check (category_type in ('INCOME', 'EXPENSE')),
  icon text,
  color text,
  is_system boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.categories is 'user_id NULL = categoría del sistema (compartida, sólo lectura para los usuarios). user_id definido = categoría personalizada del usuario.';

create index idx_categories_user_id on public.categories (user_id);

alter table public.categories enable row level security;

create policy "categories_select" on public.categories for select using (user_id = auth.uid() or user_id is null);
create policy "categories_insert_own" on public.categories for insert with check (user_id = auth.uid());
create policy "categories_update_own" on public.categories for update using (user_id = auth.uid() and is_system = false) with check (user_id = auth.uid());
create policy "categories_delete_own" on public.categories for delete using (user_id = auth.uid() and is_system = false);

create trigger trg_categories_updated_at before update on public.categories
  for each row execute function public.fn_set_updated_at();

create table public.subcategories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  name text not null,
  is_system boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subcategories_category_id on public.subcategories (category_id);
create index idx_subcategories_user_id on public.subcategories (user_id);

alter table public.subcategories enable row level security;

create policy "subcategories_select" on public.subcategories for select using (user_id = auth.uid() or user_id is null);
create policy "subcategories_insert_own" on public.subcategories for insert with check (user_id = auth.uid());
create policy "subcategories_update_own" on public.subcategories for update using (user_id = auth.uid() and is_system = false) with check (user_id = auth.uid());
create policy "subcategories_delete_own" on public.subcategories for delete using (user_id = auth.uid() and is_system = false);

create trigger trg_subcategories_updated_at before update on public.subcategories
  for each row execute function public.fn_set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. recurring_transactions
-- -----------------------------------------------------------------------------
create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete cascade,
  destination_account_id uuid references public.accounts (id),
  category_id uuid references public.categories (id) on delete set null,
  subcategory_id uuid references public.subcategories (id) on delete set null,
  transaction_type text not null check (transaction_type in ('INCOME', 'EXPENSE', 'TRANSFER')),
  description text not null,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'PEN',
  frequency text not null check (frequency in ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL')),
  start_date date not null,
  end_date date,
  next_occurrence_date date not null,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_recurring_user_id on public.recurring_transactions (user_id);
create index idx_recurring_next_occurrence on public.recurring_transactions (next_occurrence_date) where active;

alter table public.recurring_transactions enable row level security;

create policy "recurring_select_own" on public.recurring_transactions for select using (user_id = auth.uid());
create policy "recurring_insert_own" on public.recurring_transactions for insert with check (user_id = auth.uid());
create policy "recurring_update_own" on public.recurring_transactions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "recurring_delete_own" on public.recurring_transactions for delete using (user_id = auth.uid());

create trigger trg_recurring_updated_at before update on public.recurring_transactions
  for each row execute function public.fn_set_updated_at();

-- -----------------------------------------------------------------------------
-- 6. import_batches — auditoría de importaciones CSV/XLSX
-- -----------------------------------------------------------------------------
create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid references public.accounts (id),
  file_name text not null,
  file_type text not null check (file_type in ('CSV', 'XLSX')),
  column_mapping jsonb not null default '{}'::jsonb,
  total_rows integer not null default 0,
  imported_rows integer not null default 0,
  duplicate_rows integer not null default 0,
  error_rows integer not null default 0,
  status text not null default 'PENDING' check (status in ('PENDING', 'PREVIEWED', 'CONFIRMED', 'FAILED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_import_batches_user_id on public.import_batches (user_id);

alter table public.import_batches enable row level security;

create policy "import_batches_select_own" on public.import_batches for select using (user_id = auth.uid());
create policy "import_batches_insert_own" on public.import_batches for insert with check (user_id = auth.uid());
create policy "import_batches_update_own" on public.import_batches for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "import_batches_delete_own" on public.import_batches for delete using (user_id = auth.uid());

create trigger trg_import_batches_updated_at before update on public.import_batches
  for each row execute function public.fn_set_updated_at();

-- -----------------------------------------------------------------------------
-- 7. credit_cards
-- -----------------------------------------------------------------------------
create table public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  bank text not null,
  brand text,
  last_four_digits text check (last_four_digits ~ '^[0-9]{4}$'),
  currency text not null default 'PEN',
  credit_limit numeric(14, 2) not null check (credit_limit > 0),
  closing_day smallint not null check (closing_day between 1 and 31),
  payment_day smallint not null check (payment_day between 1 and 31),
  annual_interest_rate numeric(6, 3),
  utilization_alert_threshold numeric(5, 2) not null default 80.00,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_credit_cards_user_id on public.credit_cards (user_id);

alter table public.credit_cards enable row level security;

create policy "credit_cards_select_own" on public.credit_cards for select using (user_id = auth.uid());
create policy "credit_cards_insert_own" on public.credit_cards for insert with check (user_id = auth.uid());
create policy "credit_cards_update_own" on public.credit_cards for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "credit_cards_delete_own" on public.credit_cards for delete using (user_id = auth.uid());

create trigger trg_credit_cards_updated_at before update on public.credit_cards
  for each row execute function public.fn_set_updated_at();

-- Compras con tarjeta (detalle de cuotas). El impacto en el ledger lo genera
-- la transacción CARD_PURCHASE vinculada (transactions.credit_card_transaction_id).
create table public.credit_card_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  credit_card_id uuid not null references public.credit_cards (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  subcategory_id uuid references public.subcategories (id) on delete set null,
  description text not null,
  merchant text,
  amount numeric(14, 2) not null check (amount > 0),
  purchase_date date not null,
  installments smallint not null default 1 check (installments >= 1),
  status text not null default 'CONFIRMED' check (status in ('PENDING', 'CONFIRMED', 'CANCELLED')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index idx_cc_transactions_user_id on public.credit_card_transactions (user_id);
create index idx_cc_transactions_card_id on public.credit_card_transactions (credit_card_id);
create index idx_cc_transactions_purchase_date on public.credit_card_transactions (purchase_date);

alter table public.credit_card_transactions enable row level security;

create policy "cc_transactions_select_own" on public.credit_card_transactions for select using (user_id = auth.uid());
create policy "cc_transactions_insert_own" on public.credit_card_transactions for insert with check (user_id = auth.uid());
create policy "cc_transactions_update_own" on public.credit_card_transactions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "cc_transactions_delete_own" on public.credit_card_transactions for delete using (user_id = auth.uid());

create trigger trg_cc_transactions_updated_at before update on public.credit_card_transactions
  for each row execute function public.fn_set_updated_at();

-- Calendario de cuotas de una compra con tarjeta (proyección, no ledger).
create table public.credit_card_installment_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  credit_card_transaction_id uuid not null references public.credit_card_transactions (id) on delete cascade,
  installment_number smallint not null check (installment_number >= 1),
  amount numeric(14, 2) not null check (amount > 0),
  statement_period date not null, -- primer día del mes de cierre al que pertenece la cuota
  status text not null default 'PENDING' check (status in ('PENDING', 'BILLED', 'PAID')),
  created_at timestamptz not null default now(),
  unique (credit_card_transaction_id, installment_number)
);

create index idx_cc_installments_user_id on public.credit_card_installment_plans (user_id);
create index idx_cc_installments_period on public.credit_card_installment_plans (statement_period);

alter table public.credit_card_installment_plans enable row level security;

create policy "cc_installments_select_own" on public.credit_card_installment_plans for select using (user_id = auth.uid());
create policy "cc_installments_insert_own" on public.credit_card_installment_plans for insert with check (user_id = auth.uid());
create policy "cc_installments_update_own" on public.credit_card_installment_plans for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "cc_installments_delete_own" on public.credit_card_installment_plans for delete using (user_id = auth.uid());

create table public.credit_card_statements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  credit_card_id uuid not null references public.credit_cards (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  closing_date date not null,
  due_date date not null,
  total_amount numeric(14, 2) not null default 0,
  minimum_payment numeric(14, 2) not null default 0,
  paid_amount numeric(14, 2) not null default 0,
  status text not null default 'OPEN' check (status in ('OPEN', 'CLOSED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (credit_card_id, period_start)
);

create index idx_cc_statements_user_id on public.credit_card_statements (user_id);
create index idx_cc_statements_card_id on public.credit_card_statements (credit_card_id);

alter table public.credit_card_statements enable row level security;

create policy "cc_statements_select_own" on public.credit_card_statements for select using (user_id = auth.uid());
create policy "cc_statements_insert_own" on public.credit_card_statements for insert with check (user_id = auth.uid());
create policy "cc_statements_update_own" on public.credit_card_statements for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "cc_statements_delete_own" on public.credit_card_statements for delete using (user_id = auth.uid());

create trigger trg_cc_statements_updated_at before update on public.credit_card_statements
  for each row execute function public.fn_set_updated_at();

-- -----------------------------------------------------------------------------
-- 8. loans
-- -----------------------------------------------------------------------------
create table public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lender text not null,
  description text,
  original_amount numeric(14, 2) not null check (original_amount > 0),
  interest_rate numeric(6, 3),
  installment_amount numeric(14, 2) not null check (installment_amount > 0),
  number_of_installments smallint not null check (number_of_installments > 0),
  start_date date not null,
  next_due_date date,
  estimated_end_date date,
  currency text not null default 'PEN',
  disbursement_account_id uuid references public.accounts (id),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'PAID_OFF', 'DEFAULTED', 'CANCELLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.loans is 'current_balance e installments_paid se derivan de loan_installments (ver vista loan_balances), no se materializan aquí.';

create index idx_loans_user_id on public.loans (user_id);

alter table public.loans enable row level security;

create policy "loans_select_own" on public.loans for select using (user_id = auth.uid());
create policy "loans_insert_own" on public.loans for insert with check (user_id = auth.uid());
create policy "loans_update_own" on public.loans for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "loans_delete_own" on public.loans for delete using (user_id = auth.uid());

create trigger trg_loans_updated_at before update on public.loans
  for each row execute function public.fn_set_updated_at();

create table public.loan_installments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  loan_id uuid not null references public.loans (id) on delete cascade,
  installment_number smallint not null check (installment_number >= 1),
  due_date date not null,
  principal_amount numeric(14, 2) not null check (principal_amount >= 0),
  interest_amount numeric(14, 2) not null default 0 check (interest_amount >= 0),
  total_amount numeric(14, 2) not null check (total_amount > 0),
  status text not null default 'PENDING' check (status in ('PENDING', 'PAID', 'OVERDUE')),
  paid_transaction_id uuid, -- FK agregada tras crear transactions
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (loan_id, installment_number)
);

create index idx_loan_installments_user_id on public.loan_installments (user_id);
create index idx_loan_installments_loan_id on public.loan_installments (loan_id);
create index idx_loan_installments_due_date on public.loan_installments (due_date);

alter table public.loan_installments enable row level security;

create policy "loan_installments_select_own" on public.loan_installments for select using (user_id = auth.uid());
create policy "loan_installments_insert_own" on public.loan_installments for insert with check (user_id = auth.uid());
create policy "loan_installments_update_own" on public.loan_installments for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "loan_installments_delete_own" on public.loan_installments for delete using (user_id = auth.uid());

create trigger trg_loan_installments_updated_at before update on public.loan_installments
  for each row execute function public.fn_set_updated_at();

-- -----------------------------------------------------------------------------
-- 9. bills — pagos pendientes / obligaciones futuras
-- -----------------------------------------------------------------------------
create table public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category_id uuid references public.categories (id) on delete set null,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'PEN',
  due_date date not null,
  expected_payment_date date,
  account_id uuid references public.accounts (id),
  status text not null default 'PENDING' check (status in ('PENDING', 'SCHEDULED', 'PAID', 'OVERDUE', 'CANCELLED')),
  recurrence text check (recurrence in ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL')),
  recurring boolean not null default false,
  provider text,
  notes text,
  paid_transaction_id uuid, -- FK agregada tras crear transactions
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_bills_user_id on public.bills (user_id);
create index idx_bills_due_date on public.bills (due_date);
create index idx_bills_status on public.bills (status);

alter table public.bills enable row level security;

create policy "bills_select_own" on public.bills for select using (user_id = auth.uid());
create policy "bills_insert_own" on public.bills for insert with check (user_id = auth.uid());
create policy "bills_update_own" on public.bills for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "bills_delete_own" on public.bills for delete using (user_id = auth.uid());

create trigger trg_bills_updated_at before update on public.bills
  for each row execute function public.fn_set_updated_at();

-- -----------------------------------------------------------------------------
-- 10. transactions — evento financiero central (Transaction Intake escribe aquí)
-- -----------------------------------------------------------------------------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete restrict,
  destination_account_id uuid references public.accounts (id) on delete restrict,
  credit_card_id uuid references public.credit_cards (id) on delete restrict,
  credit_card_transaction_id uuid references public.credit_card_transactions (id) on delete restrict,
  loan_id uuid references public.loans (id) on delete restrict,
  loan_installment_id uuid references public.loan_installments (id) on delete restrict,
  bill_id uuid references public.bills (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  subcategory_id uuid references public.subcategories (id) on delete set null,
  transaction_type text not null check (
    transaction_type in ('INCOME', 'EXPENSE', 'TRANSFER', 'CARD_PURCHASE', 'CARD_PAYMENT', 'LOAN_DISBURSEMENT', 'LOAN_PAYMENT')
  ),
  description text not null,
  amount numeric(14, 2) not null check (amount > 0),
  principal_amount numeric(14, 2) check (principal_amount >= 0),
  interest_amount numeric(14, 2) check (interest_amount >= 0),
  currency text not null default 'PEN',
  transaction_date date not null,
  status text not null default 'CONFIRMED' check (status in ('PENDING', 'CONFIRMED', 'CANCELLED')),
  payment_method text,
  merchant text,
  notes text,
  source text not null default 'WEB' check (
    source in ('WEB', 'CSV', 'XLSX', 'RECURRING', 'BILL', 'CREDIT_CARD', 'WHATSAPP', 'BANK_API', 'OCR', 'API')
  ),
  external_reference text,
  recurring_transaction_id uuid references public.recurring_transactions (id) on delete set null,
  import_batch_id uuid references public.import_batches (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint chk_transfer_destination check (
    transaction_type <> 'TRANSFER' or (destination_account_id is not null and destination_account_id <> account_id)
  ),
  constraint chk_card_requires_card check (
    transaction_type not in ('CARD_PURCHASE', 'CARD_PAYMENT') or credit_card_id is not null
  ),
  constraint chk_loan_requires_loan check (
    transaction_type not in ('LOAN_DISBURSEMENT', 'LOAN_PAYMENT') or loan_id is not null
  ),
  constraint chk_account_types_require_account check (
    transaction_type not in ('INCOME', 'EXPENSE', 'TRANSFER', 'CARD_PAYMENT', 'LOAN_DISBURSEMENT', 'LOAN_PAYMENT')
    or account_id is not null
  )
);

comment on table public.transactions is 'Fuente de verdad de "qué pasó". El efecto en saldos lo generan automáticamente los ledger_entries vía trigger fn_sync_ledger_entries. Ver docs/architecture.md §3.';

create index idx_transactions_user_id on public.transactions (user_id);
create index idx_transactions_user_date on public.transactions (user_id, transaction_date desc);
create index idx_transactions_account_id on public.transactions (account_id);
create index idx_transactions_destination_account_id on public.transactions (destination_account_id);
create index idx_transactions_category_id on public.transactions (category_id);
create index idx_transactions_status on public.transactions (status);
create index idx_transactions_credit_card_id on public.transactions (credit_card_id);
create index idx_transactions_loan_id on public.transactions (loan_id);
create index idx_transactions_not_deleted on public.transactions (user_id, transaction_date desc) where deleted_at is null;

alter table public.transactions enable row level security;

create policy "transactions_select_own" on public.transactions for select using (user_id = auth.uid());
create policy "transactions_insert_own" on public.transactions for insert with check (user_id = auth.uid());
create policy "transactions_update_own" on public.transactions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "transactions_delete_own" on public.transactions for delete using (user_id = auth.uid());

create trigger trg_transactions_updated_at before update on public.transactions
  for each row execute function public.fn_set_updated_at();

-- Ahora que transactions existe, cerramos las referencias diferidas.
alter table public.bills
  add constraint fk_bills_paid_transaction foreign key (paid_transaction_id) references public.transactions (id) on delete set null;

alter table public.loan_installments
  add constraint fk_loan_installments_paid_transaction foreign key (paid_transaction_id) references public.transactions (id) on delete set null;

-- -----------------------------------------------------------------------------
-- 11. ledger_entries — efecto real en saldos, generado sólo por trigger
-- -----------------------------------------------------------------------------
create table public.ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  transaction_id uuid not null references public.transactions (id) on delete cascade,
  target_type text not null check (target_type in ('ACCOUNT', 'CREDIT_CARD', 'LOAN')),
  target_id uuid not null,
  amount numeric(14, 2) not null,
  currency text not null default 'PEN',
  entry_date date not null,
  created_at timestamptz not null default now()
);

comment on table public.ledger_entries is 'Generado exclusivamente por fn_sync_ledger_entries (SECURITY DEFINER). Los usuarios sólo tienen permiso de SELECT: nunca se escribe a mano ni desde la app.';

create index idx_ledger_entries_user_id on public.ledger_entries (user_id);
create index idx_ledger_entries_transaction_id on public.ledger_entries (transaction_id);
create index idx_ledger_entries_target on public.ledger_entries (target_type, target_id);

alter table public.ledger_entries enable row level security;

create policy "ledger_entries_select_own" on public.ledger_entries for select using (user_id = auth.uid());
-- Intencional: no existen policies de insert/update/delete para el rol authenticated.
-- Sólo fn_sync_ledger_entries (SECURITY DEFINER) puede escribir esta tabla.

-- Genera/regenera las líneas de ledger de una transacción según su tipo.
-- Estrategia: borrar y recrear en cada INSERT/UPDATE (idempotente y simple).
create or replace function public.fn_sync_ledger_entries()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.ledger_entries where transaction_id = new.id;

  -- Sólo las transacciones CONFIRMED y no eliminadas afectan saldos (§58).
  if new.status <> 'CONFIRMED' or new.deleted_at is not null then
    return new;
  end if;

  if new.transaction_type = 'INCOME' then
    insert into public.ledger_entries (user_id, transaction_id, target_type, target_id, amount, currency, entry_date)
    values (new.user_id, new.id, 'ACCOUNT', new.account_id, new.amount, new.currency, new.transaction_date);

  elsif new.transaction_type = 'EXPENSE' then
    insert into public.ledger_entries (user_id, transaction_id, target_type, target_id, amount, currency, entry_date)
    values (new.user_id, new.id, 'ACCOUNT', new.account_id, -new.amount, new.currency, new.transaction_date);

  elsif new.transaction_type = 'TRANSFER' then
    insert into public.ledger_entries (user_id, transaction_id, target_type, target_id, amount, currency, entry_date)
    values
      (new.user_id, new.id, 'ACCOUNT', new.account_id, -new.amount, new.currency, new.transaction_date),
      (new.user_id, new.id, 'ACCOUNT', new.destination_account_id, new.amount, new.currency, new.transaction_date);

  elsif new.transaction_type = 'CARD_PURCHASE' then
    insert into public.ledger_entries (user_id, transaction_id, target_type, target_id, amount, currency, entry_date)
    values (new.user_id, new.id, 'CREDIT_CARD', new.credit_card_id, new.amount, new.currency, new.transaction_date);

  elsif new.transaction_type = 'CARD_PAYMENT' then
    insert into public.ledger_entries (user_id, transaction_id, target_type, target_id, amount, currency, entry_date)
    values
      (new.user_id, new.id, 'ACCOUNT', new.account_id, -new.amount, new.currency, new.transaction_date),
      (new.user_id, new.id, 'CREDIT_CARD', new.credit_card_id, -new.amount, new.currency, new.transaction_date);

  elsif new.transaction_type = 'LOAN_DISBURSEMENT' then
    insert into public.ledger_entries (user_id, transaction_id, target_type, target_id, amount, currency, entry_date)
    values
      (new.user_id, new.id, 'ACCOUNT', new.account_id, new.amount, new.currency, new.transaction_date),
      (new.user_id, new.id, 'LOAN', new.loan_id, new.amount, new.currency, new.transaction_date);

  elsif new.transaction_type = 'LOAN_PAYMENT' then
    insert into public.ledger_entries (user_id, transaction_id, target_type, target_id, amount, currency, entry_date)
    values
      (new.user_id, new.id, 'ACCOUNT', new.account_id, -new.amount, new.currency, new.transaction_date),
      (new.user_id, new.id, 'LOAN', new.loan_id, -coalesce(new.principal_amount, new.amount), new.currency, new.transaction_date);
  end if;

  return new;
end;
$$;

create trigger trg_sync_ledger_entries
  after insert or update on public.transactions
  for each row execute function public.fn_sync_ledger_entries();

-- Vistas de saldo — fuente de verdad para el Financial Engine.
create view public.account_balances as
select
  a.id as account_id,
  a.user_id,
  a.initial_balance + coalesce(sum(le.amount), 0) as current_balance
from public.accounts a
left join public.ledger_entries le on le.target_type = 'ACCOUNT' and le.target_id = a.id
group by a.id, a.user_id, a.initial_balance;

create view public.credit_card_balances as
select
  c.id as credit_card_id,
  c.user_id,
  c.credit_limit,
  coalesce(sum(le.amount), 0) as current_debt,
  c.credit_limit - coalesce(sum(le.amount), 0) as available_credit
from public.credit_cards c
left join public.ledger_entries le on le.target_type = 'CREDIT_CARD' and le.target_id = c.id
group by c.id, c.user_id, c.credit_limit;

create view public.loan_balances as
select
  l.id as loan_id,
  l.user_id,
  l.original_amount,
  coalesce(sum(le.amount), 0) as current_balance
from public.loans l
left join public.ledger_entries le on le.target_type = 'LOAN' and le.target_id = l.id
group by l.id, l.user_id, l.original_amount;

-- -----------------------------------------------------------------------------
-- 12. budgets / budget_categories
-- -----------------------------------------------------------------------------
create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  year smallint not null,
  month smallint not null check (month between 1 and 12),
  expected_income numeric(14, 2) not null default 0,
  savings_target numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, year, month)
);

create index idx_budgets_user_id on public.budgets (user_id);

alter table public.budgets enable row level security;

create policy "budgets_select_own" on public.budgets for select using (user_id = auth.uid());
create policy "budgets_insert_own" on public.budgets for insert with check (user_id = auth.uid());
create policy "budgets_update_own" on public.budgets for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "budgets_delete_own" on public.budgets for delete using (user_id = auth.uid());

create trigger trg_budgets_updated_at before update on public.budgets
  for each row execute function public.fn_set_updated_at();

create table public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  budget_id uuid not null references public.budgets (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  allocated_amount numeric(14, 2) not null check (allocated_amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (budget_id, category_id)
);

create index idx_budget_categories_budget_id on public.budget_categories (budget_id);

alter table public.budget_categories enable row level security;

create policy "budget_categories_select_own" on public.budget_categories for select using (user_id = auth.uid());
create policy "budget_categories_insert_own" on public.budget_categories for insert with check (user_id = auth.uid());
create policy "budget_categories_update_own" on public.budget_categories for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "budget_categories_delete_own" on public.budget_categories for delete using (user_id = auth.uid());

create trigger trg_budget_categories_updated_at before update on public.budget_categories
  for each row execute function public.fn_set_updated_at();

-- -----------------------------------------------------------------------------
-- 13. subscriptions
-- -----------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  provider text,
  category_id uuid references public.categories (id) on delete set null,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'PEN',
  frequency text not null check (frequency in ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL')),
  next_payment_date date not null,
  account_id uuid references public.accounts (id),
  active boolean not null default true,
  start_date date not null default current_date,
  cancellation_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_user_id on public.subscriptions (user_id);
create index idx_subscriptions_next_payment on public.subscriptions (next_payment_date) where active;

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions for select using (user_id = auth.uid());
create policy "subscriptions_insert_own" on public.subscriptions for insert with check (user_id = auth.uid());
create policy "subscriptions_update_own" on public.subscriptions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "subscriptions_delete_own" on public.subscriptions for delete using (user_id = auth.uid());

create trigger trg_subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.fn_set_updated_at();

-- -----------------------------------------------------------------------------
-- 14. financial_goals / goal_contributions
-- -----------------------------------------------------------------------------
create table public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null check (target_amount > 0),
  target_date date,
  account_id uuid references public.accounts (id),
  priority text not null default 'MEDIUM' check (priority in ('LOW', 'MEDIUM', 'HIGH')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'COMPLETED', 'CANCELLED')),
  currency text not null default 'PEN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.financial_goals is 'current_amount se deriva de la suma de goal_contributions (ver vista goal_progress), no se materializa aquí.';

create index idx_financial_goals_user_id on public.financial_goals (user_id);

alter table public.financial_goals enable row level security;

create policy "financial_goals_select_own" on public.financial_goals for select using (user_id = auth.uid());
create policy "financial_goals_insert_own" on public.financial_goals for insert with check (user_id = auth.uid());
create policy "financial_goals_update_own" on public.financial_goals for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "financial_goals_delete_own" on public.financial_goals for delete using (user_id = auth.uid());

create trigger trg_financial_goals_updated_at before update on public.financial_goals
  for each row execute function public.fn_set_updated_at();

create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null references public.financial_goals (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  contribution_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_goal_contributions_goal_id on public.goal_contributions (goal_id);

alter table public.goal_contributions enable row level security;

create policy "goal_contributions_select_own" on public.goal_contributions for select using (user_id = auth.uid());
create policy "goal_contributions_insert_own" on public.goal_contributions for insert with check (user_id = auth.uid());
create policy "goal_contributions_update_own" on public.goal_contributions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "goal_contributions_delete_own" on public.goal_contributions for delete using (user_id = auth.uid());

create view public.goal_progress as
select
  g.id as goal_id,
  g.user_id,
  g.target_amount,
  coalesce(sum(gc.amount), 0) as current_amount
from public.financial_goals g
left join public.goal_contributions gc on gc.goal_id = g.id
group by g.id, g.user_id, g.target_amount;

-- -----------------------------------------------------------------------------
-- 15. assets / liabilities — patrimonio
-- -----------------------------------------------------------------------------
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  asset_type text not null check (asset_type in ('CASH', 'ACCOUNT', 'INVESTMENT', 'PROPERTY', 'VEHICLE', 'OTHER')),
  linked_account_id uuid references public.accounts (id),
  current_value numeric(14, 2) not null check (current_value >= 0),
  currency text not null default 'PEN',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.assets is 'Activos manuales (propiedades, vehículos, inversiones externas). Las cuentas ya se suman al patrimonio vía account_balances; linked_account_id evita duplicar el activo si se registra aquí también.';

create index idx_assets_user_id on public.assets (user_id);

alter table public.assets enable row level security;

create policy "assets_select_own" on public.assets for select using (user_id = auth.uid());
create policy "assets_insert_own" on public.assets for insert with check (user_id = auth.uid());
create policy "assets_update_own" on public.assets for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "assets_delete_own" on public.assets for delete using (user_id = auth.uid());

create trigger trg_assets_updated_at before update on public.assets
  for each row execute function public.fn_set_updated_at();

create table public.liabilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  liability_type text not null check (liability_type in ('CREDIT_CARD', 'LOAN', 'MORTGAGE', 'OTHER')),
  linked_credit_card_id uuid references public.credit_cards (id),
  linked_loan_id uuid references public.loans (id),
  current_balance numeric(14, 2) not null check (current_balance >= 0),
  currency text not null default 'PEN',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.liabilities is 'Pasivos manuales (hipotecas, deudas informales). Tarjetas/préstamos ya se suman al patrimonio vía credit_card_balances/loan_balances; los campos linked_* evitan duplicar el pasivo.';

create index idx_liabilities_user_id on public.liabilities (user_id);

alter table public.liabilities enable row level security;

create policy "liabilities_select_own" on public.liabilities for select using (user_id = auth.uid());
create policy "liabilities_insert_own" on public.liabilities for insert with check (user_id = auth.uid());
create policy "liabilities_update_own" on public.liabilities for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "liabilities_delete_own" on public.liabilities for delete using (user_id = auth.uid());

create trigger trg_liabilities_updated_at before update on public.liabilities
  for each row execute function public.fn_set_updated_at();

-- -----------------------------------------------------------------------------
-- 16. financial_snapshots — historial mensual de patrimonio
-- -----------------------------------------------------------------------------
create table public.financial_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  snapshot_date date not null,
  total_assets numeric(14, 2) not null default 0,
  total_liabilities numeric(14, 2) not null default 0,
  net_worth numeric(14, 2) not null default 0,
  cash numeric(14, 2) not null default 0,
  debt numeric(14, 2) not null default 0,
  investments numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, snapshot_date)
);

create index idx_financial_snapshots_user_date on public.financial_snapshots (user_id, snapshot_date desc);

alter table public.financial_snapshots enable row level security;

create policy "financial_snapshots_select_own" on public.financial_snapshots for select using (user_id = auth.uid());
create policy "financial_snapshots_insert_own" on public.financial_snapshots for insert with check (user_id = auth.uid());
create policy "financial_snapshots_update_own" on public.financial_snapshots for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "financial_snapshots_delete_own" on public.financial_snapshots for delete using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 17. audit_logs
-- -----------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null check (action in ('CREATE', 'UPDATE', 'DELETE', 'CANCEL', 'IMPORT', 'RESTORE', 'BACKUP')),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is 'Escrita únicamente por triggers SECURITY DEFINER (fn_write_audit_log) o por Server Actions administrativas. Nunca debe contener secretos: old_data/new_data excluyen columnas sensibles.';

create index idx_audit_logs_user_id on public.audit_logs (user_id);
create index idx_audit_logs_entity on public.audit_logs (entity_type, entity_id);
create index idx_audit_logs_created_at on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;

create policy "audit_logs_select_own" on public.audit_logs for select using (user_id = auth.uid());
-- Sin policies de insert/update/delete para authenticated: sólo funciones SECURITY DEFINER escriben aquí.

create or replace function public.fn_write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_action text;
begin
  v_user_id := coalesce(new.user_id, old.user_id);

  if tg_op = 'INSERT' then
    v_action := 'CREATE';
  elsif tg_op = 'DELETE' then
    v_action := 'DELETE';
  else
    v_action := 'UPDATE';
  end if;

  insert into public.audit_logs (user_id, entity_type, entity_id, action, old_data, new_data)
  values (
    v_user_id,
    tg_table_name,
    coalesce(new.id, old.id),
    v_action,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('UPDATE', 'INSERT') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

create trigger trg_audit_transactions
  after insert or update or delete on public.transactions
  for each row execute function public.fn_write_audit_log();

create trigger trg_audit_accounts
  after insert or update or delete on public.accounts
  for each row execute function public.fn_write_audit_log();

create trigger trg_audit_credit_cards
  after insert or update or delete on public.credit_cards
  for each row execute function public.fn_write_audit_log();

create trigger trg_audit_credit_card_transactions
  after insert or update or delete on public.credit_card_transactions
  for each row execute function public.fn_write_audit_log();

create trigger trg_audit_loans
  after insert or update or delete on public.loans
  for each row execute function public.fn_write_audit_log();

create trigger trg_audit_budgets
  after insert or update or delete on public.budgets
  for each row execute function public.fn_write_audit_log();

create trigger trg_audit_bills
  after insert or update or delete on public.bills
  for each row execute function public.fn_write_audit_log();

create trigger trg_audit_import_batches
  after insert or update on public.import_batches
  for each row execute function public.fn_write_audit_log();

-- -----------------------------------------------------------------------------
-- 18. whatsapp_connections — esquema listo, canal DESHABILITADO (ver docs/whatsapp.md)
-- -----------------------------------------------------------------------------
create table public.whatsapp_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  phone_number_hash text not null,
  verified boolean not null default false,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, phone_number_hash)
);

comment on table public.whatsapp_connections is 'Modelo preparado para la Fase Futura A (WhatsApp). No se usa mientras WHATSAPP_ENABLED=false. Nunca autoriza acciones críticas (restore, delete, password) por sí sola — ver docs/whatsapp.md §Seguridad.';

alter table public.whatsapp_connections enable row level security;

create policy "whatsapp_connections_select_own" on public.whatsapp_connections for select using (user_id = auth.uid());
create policy "whatsapp_connections_insert_own" on public.whatsapp_connections for insert with check (user_id = auth.uid());
create policy "whatsapp_connections_update_own" on public.whatsapp_connections for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "whatsapp_connections_delete_own" on public.whatsapp_connections for delete using (user_id = auth.uid());

create trigger trg_whatsapp_connections_updated_at before update on public.whatsapp_connections
  for each row execute function public.fn_set_updated_at();

-- =============================================================================
-- Fin de la migración inicial.
-- =============================================================================
