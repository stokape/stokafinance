-- =============================================================================
-- STOKA Finance — infraestructura base de notificaciones push (Web Push)
--
-- Guarda las suscripciones push (endpoint + claves) que el navegador genera
-- al activar notificaciones (ver Configuración). Zero-cost: usa el
-- protocolo Web Push estándar (VAPID) contra el servicio push del propio
-- navegador (FCM para Chrome, servicio de Mozilla/Apple para el resto) —
-- no requiere ningún servicio de terceros de pago.
-- =============================================================================

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh_key text not null,
  auth_key text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

comment on table public.push_subscriptions is
  'Suscripciones de Web Push por dispositivo/navegador. Un usuario puede tener varias (un dispositivo cada una). Enviar un push es responsabilidad del server (VAPID_PRIVATE_KEY nunca sale del backend) — ver src/lib/push/send-push.ts.';

create index idx_push_subscriptions_user_id on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own" on public.push_subscriptions for select using (user_id = auth.uid());
create policy "push_subscriptions_insert_own" on public.push_subscriptions for insert with check (user_id = auth.uid());
create policy "push_subscriptions_delete_own" on public.push_subscriptions for delete using (user_id = auth.uid());
-- Sin policy de update: se borra y se vuelve a crear si algo cambia (más simple, no hay campos mutables reales).
