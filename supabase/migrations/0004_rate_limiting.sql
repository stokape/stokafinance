-- =============================================================================
-- STOKA Finance — Rate limiting propio (auditoría de seguridad, SECURITY-02)
--
-- Antes de esta migración no existía ningún freno propio en /login,
-- /register ni /forgot-password — sólo el límite opaco/global de Supabase
-- Auth. Esta tabla + función implementan una ventana deslizante simple,
-- zero-cost (sin Redis ni servicio externo), consultada desde los Server
-- Actions de auth ANTES de llamar a Supabase Auth.
--
-- Diseño: `rate_key` combina acción+identificador (ej. "login_email:x@y.com"
-- o "login_ip:1.2.3.4"). La tabla NUNCA se expone directo por PostgREST —
-- ni `anon` ni `authenticated` tienen grants sobre ella — sólo la función
-- `fn_check_rate_limit` (security definer) puede leerla/escribirla, y sólo
-- esa función se expone vía RPC. Esto evita que alguien consulte
-- `/rest/v1/rate_limit_events` directo y vea qué emails/IPs se están
-- intentando (que sería en sí una fuga de información sobre quién está
-- siendo atacado).
-- =============================================================================

create table public.rate_limit_events (
  id bigint generated always as identity primary key,
  rate_key text not null,
  created_at timestamptz not null default now()
);

create index idx_rate_limit_events_key_time on public.rate_limit_events (rate_key, created_at desc);

comment on table public.rate_limit_events is
  'Bookkeeping de rate limiting propio (ventana deslizante). Nunca se expone directo vía PostgREST — sólo a través de fn_check_rate_limit(). Ver auditoría de seguridad SECURITY-02.';

-- RLS habilitada sin ninguna policy = deny-by-default para anon/authenticated
-- a través de PostgREST (incluso aunque hubiera un grant de tabla, que no
-- lo hay). service_role la sigue viendo directo si algún día hace falta
-- para soporte/debug manual.
alter table public.rate_limit_events enable row level security;

-- Revoca explícitamente cualquier grant heredado del "grant all ... to
-- anon, authenticated" de 0001_init.sql — defensa en profundidad: aunque
-- RLS sin policies ya bloquea todo, esto además bloquea a nivel de tabla.
revoke all on public.rate_limit_events from anon, authenticated;

-- -----------------------------------------------------------------------------
-- fn_check_rate_limit: intenta registrar un intento bajo `p_key`. Devuelve
-- `true` si está permitido (y lo registra), `false` si ya se alcanzó el
-- máximo de intentos en la ventana (y NO lo registra, para no extender la
-- ventana de bloqueo indefinidamente con reintentos).
-- -----------------------------------------------------------------------------
create or replace function public.fn_check_rate_limit(p_key text, p_max_attempts int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  -- Limpia sólo las filas vencidas de ESTA key (no un DELETE de toda la
  -- tabla) — barato, y mantiene la tabla acotada sin necesitar un cron.
  delete from public.rate_limit_events
    where rate_key = p_key and created_at < now() - (p_window_seconds || ' seconds')::interval;

  select count(*) into v_count from public.rate_limit_events where rate_key = p_key;

  if v_count >= p_max_attempts then
    return false;
  end if;

  insert into public.rate_limit_events (rate_key) values (p_key);
  return true;
end;
$$;

comment on function public.fn_check_rate_limit is
  'Ventana deslizante de rate limiting. security definer: corre con los privilegios del owner (bypassa RLS de rate_limit_events), por eso la tabla puede quedar sin policies/grants para anon/authenticated y sólo esta función queda expuesta.';

-- Sólo la función es invocable — nunca la tabla directamente.
grant execute on function public.fn_check_rate_limit(text, int, int) to anon, authenticated;
