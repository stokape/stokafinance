/**
 * Cap compartido de filas por importación (SECURITY-09). Antes sólo lo
 * aplicaba `confirmCsvImportAction` — `checkImportDuplicatesAction` recibe
 * el mismo `rows[]` un paso antes en el wizard y no tenía límite propio,
 * dejando el único freno en el body-size-limit genérico (1MB) de Server
 * Actions de Next. Un mismo cap explícito en ambos puntos de entrada.
 *
 * Vive fuera de `actions/csv-import.actions.ts` a propósito: un archivo
 * `"use server"` sólo puede exportar funciones async — cualquier otro
 * export (una constante, por ejemplo) rompe la compilación de TODO el
 * módulo en build (Turbopack lo reporta como "module has no exports at all").
 */
export const MAX_CSV_IMPORT_ROWS = 2000;
