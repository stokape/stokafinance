"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TransactionListItem } from "@/features/transactions/types/transaction.types";

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function buildCsv(transactions: TransactionListItem[]): string {
  const header = ["Fecha", "Descripción", "Categoría", "Cuenta", "Tipo", "Estado", "Monto", "Moneda"];
  const rows = transactions.map((tx) =>
    [
      tx.transactionDate,
      tx.description,
      tx.categoryName ?? "",
      tx.accountName ?? "",
      tx.transactionType,
      tx.status,
      tx.amount,
      tx.currency,
    ]
      .map((field) => escapeCsvField(String(field)))
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

/**
 * Exportación 100% client-side (§30): arma el CSV en el navegador a partir
 * de los datos ya cargados en la página — sin subir nada al servidor, sin
 * costo, sin límite de tamaño de request.
 */
export function ExportCsvButton({ transactions }: { transactions: TransactionListItem[] }) {
  function handleExport() {
    const csv = buildCsv(transactions);
    const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `stoka-finance-reporte-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={transactions.length === 0}>
      <Download className="h-3.5 w-3.5" /> Exportar CSV
    </Button>
  );
}
