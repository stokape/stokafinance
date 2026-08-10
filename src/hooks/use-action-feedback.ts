"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/types/action-result";

/**
 * Muestra un toast y ejecuta `onSuccess` cuando el `state` de un
 * `useActionState` cambia tras una Server Action — sin la trampa de
 * "isPending → wasPending" (que dispara `setState` sincrónicamente dentro
 * de un efecto). Compara identidad de referencia: `useActionState` siempre
 * entrega un objeto nuevo cuando la acción termina, así que un cambio de
 * referencia equivale a "la acción acaba de resolver".
 */
export function useActionFeedback<T>(
  state: ActionResult<T>,
  options: { successMessage?: string; onSuccess?: (data: T) => void } = {},
): void {
  const previousState = useRef(state);

  useEffect(() => {
    if (previousState.current === state) return;
    previousState.current = state;

    if (state.ok) {
      if (options.successMessage) toast.success(options.successMessage);
      options.onSuccess?.(state.data);
    } else if (state.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}
