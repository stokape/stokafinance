/**
 * Resultado uniforme de Server Actions. Nunca se lanza una excepción hacia
 * la UI con el mensaje interno del error — sólo un `error` seguro para
 * mostrar al usuario. Los detalles reales van a `logger.error` server-side.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function actionSuccess<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionError(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}
