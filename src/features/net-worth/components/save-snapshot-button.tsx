"use client";

import { useTransition } from "react";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveSnapshotAction } from "@/features/net-worth/actions/net-worth.actions";

export function SaveSnapshotButton() {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await saveSnapshotAction();
      if (result.ok) toast.success("Snapshot de hoy guardado");
      else toast.error(result.error);
    });
  }

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={isPending}>
      <Camera className="h-3.5 w-3.5" /> Guardar snapshot de hoy
    </Button>
  );
}
