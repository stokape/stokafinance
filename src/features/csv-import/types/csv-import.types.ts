export interface CsvColumnMapping {
  dateColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  /** Si viene marcado, `amountColumn` se interpreta como monto con signo (positivo=ingreso, negativo=gasto). Si no, se usan columnas separadas. */
  singleAmountColumn: boolean;
  debitColumn?: string;
  creditColumn?: string;
  merchantColumn?: string;
}

export interface RawCsvRow {
  rowIndex: number;
  values: Record<string, string>;
}

export type CsvTransactionType = "INCOME" | "EXPENSE";

export interface NormalizedCsvRow {
  rowIndex: number;
  date: string | null; // YYYY-MM-DD, null si no se pudo parsear
  description: string;
  merchant: string | null;
  amount: string | null; // siempre positivo; el signo lo da transactionType
  transactionType: CsvTransactionType;
  rawDate: string;
  rawAmount: string;
}

export interface PreviewRow extends NormalizedCsvRow {
  isDuplicate: boolean;
  included: boolean;
  hasError: boolean;
}

export interface ImportSummary {
  imported: number;
  duplicates: number;
  errors: number;
  total: number;
}
