-- =============================================================================
-- STOKA Finance — Corrige las advertencias (no críticas) del Security
-- Advisor de Supabase que quedaron tras cerrar el hallazgo crítico de las
-- vistas (0005_fix_security_definer_views.sql).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. "Function Search Path Mutable" — public.fn_set_updated_at
--
-- Era la única función sin `set search_path` fijo (el resto ya lo tenía
-- desde 0001_init.sql / 0004_rate_limiting.sql). Sin un search_path fijo,
-- una sesión con un search_path manipulado podría hacer que referencias no
-- calificadas dentro de la función resuelvan contra un esquema distinto al
-- esperado (CVE-2018-1058). Defensa en profundidad, no explotable hoy en
-- concreto (la función sólo hace `new.updated_at = now()`, sin referencias
-- a objetos), pero se cierra por consistencia con el resto de funciones.
-- -----------------------------------------------------------------------------
alter function public.fn_set_updated_at() set search_path = public;

-- -----------------------------------------------------------------------------
-- 2. "Public/Signed-In Users Can Execute SECURITY DEFINER Function" —
--    fn_set_updated_at, handle_new_user, fn_sync_ledger_entries,
--    fn_write_audit_log.
--
-- Postgres otorga EXECUTE a PUBLIC (todo rol, incluido anon) por defecto al
-- crear una función — nadie lo revocó explícitamente al crearlas. Las 4
-- funciones de arriba SÓLO se usan como triggers internos (`for each row
-- execute function ...`); ninguna se llama desde la app vía
-- `supabase.rpc(...)`. El mecanismo de triggers de Postgres NO requiere que
-- el rol que dispara el evento (INSERT/UPDATE en la tabla) tenga EXECUTE
-- sobre la función del trigger — la invoca con los privilegios de la
-- función en sí, independientemente de los grants de EXECUTE. Revocar el
-- EXECUTE directo es entonces seguro: cierra la posibilidad de invocarlas
-- fuera de su contexto de trigger (ej. `supabase.rpc('fn_write_audit_log')`
-- a mano) sin afectar en nada su funcionamiento normal como triggers.
--
-- fn_check_rate_limit NO se toca: su grant a anon/authenticated es
-- intencional y ya está documentado en 0004_rate_limiting.sql — el rate
-- limiting de login/registro debe poder invocarse ANTES de que exista
-- sesión (usuario anónimo intentando iniciar sesión).
-- -----------------------------------------------------------------------------
revoke execute on function public.fn_set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.fn_sync_ledger_entries() from public, anon, authenticated;
revoke execute on function public.fn_write_audit_log() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. "Leaked Password Protection Disabled"
--
-- No es una alerta de SQL — es un toggle del dashboard de Supabase
-- (Authentication → Sign In / Providers → sección de contraseña →
-- "Leaked Password Protection"), que valida contraseñas contra la base de
-- HaveIBeenPwned (k-anonimato, sin enviar la contraseña real) en
-- registro/cambio de contraseña. Gratis, sin cambios de código. Activar
-- manualmente en el dashboard de producción — no hay SQL equivalente.
-- -----------------------------------------------------------------------------
