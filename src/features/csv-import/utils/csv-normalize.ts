import { parse, isValid, format } from "date-fns";
import type { CsvColumnMapping, CsvTransactionType, NormalizedCsvRow, RawCsvRow } from "../types/csv-import.types";

/**
 * Formatos de fecha comunes en exportaciones de bancos peruanos y hojas de
 * cálculo. Se prueban en orden hasta encontrar uno válido — nunca se asume
 * un formato único, ya que cada banco exporta distinto.
 */
const DATE_FORMATS = ["yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy", "dd-MM-yyyy", "d/M/yyyy", "yyyy/MM/dd"];

export function parseCsvDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  for (const pattern of DATE_FORMATS) {
    const parsed = parse(trimmed, pattern, new Date());
    if (isValid(parsed)) return format(parsed, "yyyy-MM-dd");
  }
  return null;
}

/** Acepta "1,234.50", "1.234,50", "-45.00", "(45.00)" (negativo contable) y normaliza a un string decimal simple. */
export function parseCsvAmount(raw: string): { amount: string | null; isNegative: boolean } {
  let trimmed = raw.trim();
  if (!trimmed) return { amount: null, isNegative: false };

  const isAccountingNegative = trimmed.startsWith("(") && trimmed.endsWith(")");
  if (isAccountingNegative) trimmed = trimmed.slice(1, -1);

  const isNegative = isAccountingNegative || trimmed.startsWith("-");
  trimmed = trimmed.replace(/^[-+]/, "").replace(/[^\d.,]/g, "");

  // Si el último separador es coma, se asume formato europeo (1.234,50); si es punto, formato US (1,234.50).
  const lastComma = trimmed.lastIndexOf(",");
  const lastDot = trimmed.lastIndexOf(".");
  if (lastComma > lastDot) {
    trimmed = trimmed.replace(/\./g, "").replace(",", ".");
  } else {
    trimmed = trimmed.replace(/,/g, "");
  }

  if (!/^\d+(\.\d+)?$/.test(trimmed) || trimmed === "") return { amount: null, isNegative };
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value === 0) return { amount: null, isNegative };

  return { amount: trimmed, isNegative };
}

export function normalizeCsvRows(rows: RawCsvRow[], mapping: CsvColumnMapping): NormalizedCsvRow[] {
  return rows.map((row) => {
    const rawDate = row.values[mapping.dateColumn] ?? "";
    const description = (row.values[mapping.descriptionColumn] ?? "").trim();
    const merchant = mapping.merchantColumn ? (row.values[mapping.merchantColumn] ?? "").trim() || null : null;

    let amount: string | null;
    let transactionType: CsvTransactionType;
    let rawAmount: string;

    if (mapping.singleAmountColumn) {
      rawAmount = row.values[mapping.amountColumn] ?? "";
      const parsed = parseCsvAmount(rawAmount);
      amount = parsed.amount;
      transactionType = parsed.isNegative ? "EXPENSE" : "INCOME";
    } else {
      const debitRaw = mapping.debitColumn ? (row.values[mapping.debitColumn] ?? "") : "";
      const creditRaw = mapping.creditColumn ? (row.values[mapping.creditColumn] ?? "") : "";
      const debit = parseCsvAmount(debitRaw);
      const credit = parseCsvAmount(creditRaw);
      if (credit.amount) {
        amount = credit.amount;
        transactionType = "INCOME";
        rawAmount = creditRaw;
      } else {
        amount = debit.amount;
        transactionType = "EXPENSE";
        rawAmount = debitRaw;
      }
    }

    return {
      rowIndex: row.rowIndex,
      date: parseCsvDate(rawDate),
      description: description || "(sin descripción)",
      merchant,
      amount,
      transactionType,
      rawDate,
      rawAmount,
    };
  });
}
