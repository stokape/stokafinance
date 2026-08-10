"use client";

import { useSyncExternalStore } from "react";

function subscribeNoop() {
  return () => {};
}

/**
 * Detecta si ya estamos montados en el cliente sin disparar un setState
 * dentro de un efecto (evita el warning react-hooks/set-state-in-effect):
 * el snapshot de servidor es `false`, el de cliente `true`, así que React
 * ya re-renderiza solo tras la hidratación. Útil para evitar mismatches de
 * hidratación (tema, portales) que dependen de APIs sólo disponibles en el
 * cliente (`window`, `document`).
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}
