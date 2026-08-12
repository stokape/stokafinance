"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildCsv, downloadCsv } from "@/lib/utils/csv-export";
import type { TransactionListItem } from "@/features/transactions/types/transaction.types";

const HEADER = ["Fecha", "Descripción", "Categoría", "Cuenta", "Tipo", "Estado", "Monto", "Moneda"];

function toRows(transactions: TransactionListItem[]): string[][] {
  return transactions.map((tx) => [
    tx.transactionDate,
    tx.description,
    tx.categoryName ?? "",
    tx.accountName ?? "",
    tx.transactionType,
    tx.status,
    String(tx.amount),
    tx.currency,
  ]);
}

/**
 * Exportación 100% client-side (§30): arma el CSV en el navegador a partir
 * de los datos ya cargados en la página — sin subir nada al servidor, sin
 * costo, sin límite de tamaño de request. `buildCsv` neutraliza fórmulas
 * (SECURITY-08) antes de armar el archivo.
 */
export function ExportCsvButton({ transactions }: { transactions: TransactionListItem[] }) {
  function handleExport() {
    const csv = buildCsv(HEADER, toRows(transactions));
    downloadCsv(csv, `stoka-finance-reporte-${new Date().toISOString().slice(0, 10)}.csv`);
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={transactions.length === 0}>
      <Download className="h-3.5 w-3.5" /> Exportar CSV
    </Button>
  );
}
