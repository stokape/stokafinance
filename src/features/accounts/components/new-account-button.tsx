"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountFormDialog } from "@/features/accounts/components/account-form-dialog";

export function NewAccountButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Nueva cuenta
      </Button>
      <AccountFormDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
