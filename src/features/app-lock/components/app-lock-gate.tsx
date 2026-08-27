"use client";

import { useEffect, useState } from "react";
import { Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isAppLockEnabled, isUnlockedThisSession, markUnlockedThisSession, verifyAppLock } from "@/features/app-lock/lib/app-lock";

type GateState = "checking" | "passthrough" | "locked" | "verifying";

/**
 * Envuelve el layout de la app autenticada. Si el usuario activó el
 * bloqueo biométrico en ESTE dispositivo (ver app-lock.ts — es local, no
 * server-side), pide Face ID/huella una vez por sesión de pestaña antes de
 * mostrar el contenido. Si no lo activó (la mayoría de casos, y la
 * primera vez que se abre cualquier dispositivo), pasa directo — nunca
 * bloquea a nadie que no lo haya pedido explícitamente.
 */
export function AppLockGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GateState>("checking");

  useEffect(() => {
    function checkLock() {
      if (!isAppLockEnabled() || isUnlockedThisSession()) {
        setState("passthrough");
        return;
      }
      setState("locked");
    }
    checkLock();
  }, []);

  async function handleUnlock() {
    setState("verifying");
    const ok = await verifyAppLock();
    if (ok) {
      markUnlockedThisSession();
      setState("passthrough");
    } else {
      setState("locked");
    }
  }

  if (state === "checking") return null;
  if (state === "passthrough") return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <div className="rounded-full bg-muted p-4">
        <Fingerprint className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">STOKA Finance bloqueado</h1>
        <p className="text-sm text-muted-foreground">Desbloquea con Face ID, huella o Windows Hello para continuar.</p>
      </div>
      <Button onClick={handleUnlock} isLoading={state === "verifying"}>
        <Fingerprint className="h-4 w-4" /> Desbloquear
      </Button>
    </div>
  );
}
