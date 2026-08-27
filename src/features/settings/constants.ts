/**
 * Constantes de la Zona de peligro. Viven fuera de danger-zone.actions.ts
 * a propósito: un archivo "use server" sólo puede exportar funciones
 * async — una constante exportada ahí rompe la compilación de TODO el
 * módulo bajo Turbopack ("module has no exports at all"), no sólo un error
 * de tipos. Mismo patrón que src/features/csv-import/constants.ts.
 */
export const RESET_CONFIRMATION_WORD = "ELIMINAR";
export const DELETE_ACCOUNT_CONFIRMATION_WORD = "CERRAR CUENTA";
