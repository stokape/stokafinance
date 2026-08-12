#!/usr/bin/env node
/**
 * Verifica que toda tabla creada en supabase/migrations/ tenga
 * `enable row level security` en algún punto del historial de migraciones
 * (auditoría de seguridad, V-15).
 *
 * Por qué existe: el esquema usa `grant all ... to anon, authenticated` a
 * nivel de schema (supabase/migrations/0001_init.sql) — toda la
 * restricción real de acceso por fila vive en RLS. Una tabla nueva que
 * olvide `enable row level security` queda 100% legible/escribible por
 * cualquier usuario autenticado (o `anon`) sin ninguna otra barrera. Este
 * script es un check estático simple, sin depender de una base de datos
 * viva, pensado para correr en cada push/PR (ver .github/workflows/ci.yml).
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const migrationsDir = join(process.cwd(), "supabase", "migrations");
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const created = new Set();
const rlsEnabled = new Set();

for (const file of files) {
  const sql = readFileSync(join(migrationsDir, file), "utf8");

  for (const match of sql.matchAll(/create table (?:if not exists )?public\.(\w+)/gi)) {
    created.add(match[1]);
  }
  for (const match of sql.matchAll(/alter table public\.(\w+)\s+enable row level security/gi)) {
    rlsEnabled.add(match[1]);
  }
  for (const match of sql.matchAll(/drop table (?:if exists )?public\.(\w+)/gi)) {
    created.delete(match[1]);
    rlsEnabled.delete(match[1]);
  }
}

const missing = [...created].filter((table) => !rlsEnabled.has(table)).sort();

if (missing.length > 0) {
  console.error("❌ Tablas creadas sin `enable row level security` en supabase/migrations/:");
  for (const table of missing) console.error(`  - public.${table}`);
  console.error(
    "\nAgrega `alter table public.<tabla> enable row level security;` (+ policies) antes de mergear.",
  );
  process.exit(1);
}

console.log(`✅ RLS verificada: ${created.size} tabla(s) en supabase/migrations/, todas con RLS habilitada.`);
