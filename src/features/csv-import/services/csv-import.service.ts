import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { CsvImportRepository } from "../repositories/csv-import.repository";
import { TransactionIntakeService } from "@/features/transactions/services/transaction-intake.service";
import type { ImportSummary, NormalizedCsvRow } from "../types/csv-import.types";

function duplicateKey(date: string, amount: string, description: string): string {
  return `${date}|${Number(amount).toFixed(2)}|${description}`;
}

export class CsvImportService {
  private readonly repository: CsvImportRepository;
  private readonly intake: TransactionIntakeService;

  constructor(private readonly supabase: SupabaseClient<Database>) {
    this.repository = new CsvImportRepository(supabase);
    this.intake = new TransactionIntakeService(supabase);
  }

  /**
   * Marca como probable duplicado cualquier fila cuya combinación
   * cuenta+fecha+monto+descripción ya exista (§29: "evitar duplicados
   * utilizando combinación configurable"). Es sólo una señal para la
   * vista previa — la inserción real vuelve a validar por fila vía
   * TransactionIntakeService, que es la autoridad final.
   */
  async checkDuplicates(accountId: string, rows: NormalizedCsvRow[]): Promise<boolean[]> {
    const validDates = rows.map((r) => r.date).filter((d): d is string => d !== null);
    if (validDates.length === 0) return rows.map(() => false);

    const dateFrom = validDates.reduce((min, d) => (d < min ? d : min));
    const dateTo = validDates.reduce((max, d) => (d > max ? d : max));

    const existing = await this.repository.listExistingForDuplicateCheck(accountId, dateFrom, dateTo);
    const existingKeys = new Set(existing.map((e) => duplicateKey(e.date, e.amount, e.description)));

    return rows.map((row) => (row.date && row.amount ? existingKeys.has(duplicateKey(row.date, row.amount, row.description)) : false));
  }

  /**
   * Inserta las filas incluidas por el usuario, cada una vía
   * TransactionIntakeService (source=CSV) — el mismo pipeline que
   * cualquier otro canal, nunca un INSERT directo (docs/transaction-intake.md).
   */
  async confirmImport(
    userId: string,
    input: {
      accountId: string;
      /** Categoría aplicada a todas las filas EXPENSE/INCOME del lote — no hay edición por fila en este MVP (documentado como simplificación). */
      defaultExpenseCategoryId: string | null;
      defaultIncomeCategoryId: string | null;
      fileName: string;
      columnMapping: Record<string, unknown>;
      rows: NormalizedCsvRow[];
    },
  ): Promise<ImportSummary> {
    const batchId = await this.repository.createBatch(userId, {
      accountId: input.accountId,
      fileName: input.fileName,
      fileType: "CSV",
      columnMapping: input.columnMapping,
      totalRows: input.rows.length,
    });

    let imported = 0;
    let duplicates = 0;
    let errors = 0;

    for (const row of input.rows) {
      if (!row.date || !row.amount) {
        errors += 1;
        continue;
      }

      try {
        const categoryId = row.transactionType === "EXPENSE" ? input.defaultExpenseCategoryId : input.defaultIncomeCategoryId;
        const result = await this.intake.intake({
          userId,
          source: "CSV",
          transactionType: row.transactionType,
          amount: row.amount,
          currency: "PEN",
          accountId: input.accountId,
          categoryId,
          description: row.description,
          merchant: row.merchant,
          transactionDate: row.date,
          importBatchId: batchId,
        });
        if (result.wasDuplicate) duplicates += 1;
        else imported += 1;
      } catch {
        errors += 1;
      }
    }

    await this.repository.completeBatch(batchId, { importedRows: imported, duplicateRows: duplicates, errorRows: errors });

    return { imported, duplicates, errors, total: input.rows.length };
  }
}
