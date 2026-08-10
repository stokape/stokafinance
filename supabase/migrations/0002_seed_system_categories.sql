-- =============================================================================
-- STOKA Finance — Categorías del sistema
-- Estas filas (user_id IS NULL, is_system = true) son datos de referencia,
-- NO datos demo: se cargan también en producción. Ver supabase/seed/ para
-- los datos demo (sólo desarrollo, nunca se ejecutan en prod).
-- =============================================================================

insert into public.categories (name, category_type, is_system, sort_order) values
  ('Sueldo', 'INCOME', true, 1),
  ('Negocios', 'INCOME', true, 2),
  ('Freelance', 'INCOME', true, 3),
  ('Bonos', 'INCOME', true, 4),
  ('Intereses', 'INCOME', true, 5),
  ('Inversiones', 'INCOME', true, 6),
  ('Reembolsos', 'INCOME', true, 7),
  ('Otros ingresos', 'INCOME', true, 8),
  ('Vivienda', 'EXPENSE', true, 1),
  ('Alimentación', 'EXPENSE', true, 2),
  ('Transporte', 'EXPENSE', true, 3),
  ('Tecnología', 'EXPENSE', true, 4),
  ('Entretenimiento', 'EXPENSE', true, 5),
  ('Salud', 'EXPENSE', true, 6),
  ('Educación', 'EXPENSE', true, 7),
  ('Ropa', 'EXPENSE', true, 8),
  ('Viajes', 'EXPENSE', true, 9),
  ('Familia', 'EXPENSE', true, 10),
  ('Seguros', 'EXPENSE', true, 11),
  ('Impuestos', 'EXPENSE', true, 12),
  ('Finanzas', 'EXPENSE', true, 13),
  ('Otros gastos', 'EXPENSE', true, 14);

-- Subcategorías para las categorías de gasto con más detalle en el prompt.
insert into public.subcategories (category_id, name, is_system, sort_order)
select id, sub.name, true, sub.sort_order
from public.categories c
join lateral (
  values
    ('Vivienda', 'Alquiler', 1),
    ('Vivienda', 'Mantenimiento', 2),
    ('Vivienda', 'Electricidad', 3),
    ('Vivienda', 'Agua', 4),
    ('Vivienda', 'Internet', 5),
    ('Vivienda', 'Gas', 6),
    ('Alimentación', 'Supermercado', 1),
    ('Alimentación', 'Restaurantes', 2),
    ('Alimentación', 'Delivery', 3),
    ('Transporte', 'Combustible', 1),
    ('Transporte', 'Taxi / apps', 2),
    ('Transporte', 'Transporte público', 3),
    ('Transporte', 'Mantenimiento', 4),
    ('Transporte', 'Estacionamiento', 5),
    ('Tecnología', 'Software', 1),
    ('Tecnología', 'Hosting', 2),
    ('Tecnología', 'Dominios', 3),
    ('Tecnología', 'IA', 4),
    ('Tecnología', 'Hardware', 5),
    ('Entretenimiento', 'Streaming', 1),
    ('Entretenimiento', 'Cine', 2),
    ('Entretenimiento', 'Salidas', 3),
    ('Entretenimiento', 'Juegos', 4)
) as sub(category_name, name, sort_order) on sub.category_name = c.name
where c.is_system = true and c.user_id is null;
