"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewCreditCardDialog } from "@/features/credit-cards/components/new-credit-card-dialog";

export function NewCreditCardButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Nueva tarjeta
      </Button>
      <NewCreditCardDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
