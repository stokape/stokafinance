"use client";

import { useEffect, useState } from "react";
import { Fingerprint, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  isAppLockSupported,
  isPlatformAuthenticatorAvailable,
  isAppLockEnabled,
  registerAppLockCredential,
  disableAppLock,
} from "@/features/app-lock/lib/app-lock";

type Status = "checking" | "unsupported" | "off" | "on" | "pending";

export function AppLockToggle({ userId, email }: { userId: string; email: string }) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    async function checkStatus() {
      if (!isAppLockSupported() || !(await isPlatformAuthenticatorAvailable())) {
        setStatus("unsupported");
        return;
      }
      setStatus(isAppLockEnabled() ? "on" : "off");
    }
    checkStatus();
  }, []);

  // Sin startTransition/useTransition a propósito: WebAuthn exige que
  // create()/get() se invoquen dentro de la "activación de usuario" del
  // click real — envolverlo en una transición de React puede introducir
  // suficiente delay como para que el navegador ya no lo considere un
  // gesto directo del usuario y rechace la ceremonia (NotAllowedError).
  async function handleEnable() {
    setStatus("pending");
    const result = await registerAppLockCredential(userId, email);
    if (!result.ok) {
      toast.error(result.error);
      setStatus("off");
      return;
    }
    setStatus("on");
    toast.success("Bloqueo biométrico activado en este dispositivo");
  }

  function handleDisable() {
    disableAppLock();
    setStatus("off");
    toast.success("Bloqueo biométrico desactivado en este dispositivo");
  }

  if (status === "checking") return null;
  if (status === "unsupported") {
    return <p className="text-sm text-muted-foreground">Este dispositivo no tiene Face ID, huella o Windows Hello disponible.</p>;
  }

  return status === "on" ? (
    <Button variant="outline" onClick={handleDisable}>
      <ShieldOff className="h-4 w-4" /> Desactivar bloqueo en este dispositivo
    </Button>
  ) : (
    <Button variant="outline" onClick={handleEnable} isLoading={status === "pending"}>
      <Fingerprint className="h-4 w-4" /> Activar bloqueo biométrico en este dispositivo
    </Button>
  );
}
