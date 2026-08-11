"use client";

import { useEffect } from "react";
import { initMonitoring } from "@/lib/monitoring/sentry";

/** Inicializa Sentry en el navegador — no-op si SENTRY_DSN/NEXT_PUBLIC_SENTRY_DSN no está configurado. */
export function SentryClientInit() {
  useEffect(() => {
    initMonitoring();
  }, []);

  return null;
}
