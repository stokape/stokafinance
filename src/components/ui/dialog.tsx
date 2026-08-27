"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useMounted } from "@/hooks/use-mounted";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Modal accesible mínimo (sin dependencias externas: costo cero). Cierra con
 * Escape o click fuera, mueve el foco al abrir y lo restaura al cerrar.
 *
 * Se monta vía Portal directo a `document.body`. `position: fixed` sólo se
 * posiciona respecto al viewport si NINGÚN ancestro tiene `transform`,
 * `filter`/`backdrop-filter`, `perspective` o `will-change` (crean un
 * "containing block" propio) — el Topbar usa `backdrop-blur` y el menú de
 * "Nuevo movimiento" envuelve el diálogo en un contenedor `relative`, así
 * que sin portal el modal se posicionaba respecto a esos ancestros en vez
 * del viewport (aparecía "pegado arriba" en vez de centrado). El portal
 * elimina el problema de raíz sin depender de qué ancestro sea el culpable.
 */
export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const mounted = useMounted();

  // Ref a la última `onClose` en vez de dependencia directa del efecto: si
  // el caller pasa un `onClose` inline (`() => setOpen(false)`, el patrón
  // más común), esa función es una referencia NUEVA en cada render del
  // caller — y cualquier estado que cambie con cada tecla (ej. un input
  // controlado, como el de "escribe ELIMINAR para confirmar") dispara ese
  // render en cada letra. Con `onClose` en el array de dependencias, el
  // efecto se re-ejecutaba en cada tecla y volvía a robarle el foco al
  // input (restaurándolo a `previouslyFocused` / al panel) — en el
  // teclado virtual de un celular eso se ve como "el teclado se cierra
  // cada vez que escribo una letra". Con la ref, el efecto sólo depende de
  // `open` (abrir/cerrar de verdad), pero Escape y el click en el backdrop
  // siguen llamando a la versión más reciente de `onClose`.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus();
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        tabIndex={-1}
        className={cn(
          "relative z-10 flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-xl focus:outline-none",
          className,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="dialog-title" className="text-base font-semibold">
              {title}
            </h2>
            {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
