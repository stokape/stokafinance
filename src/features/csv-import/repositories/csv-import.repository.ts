import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/** Único punto de acceso a Supabase para `import_batches` y la consulta de duplicados. RLS filtra por user_id = auth.uid(). */
export class CsvImportRepository {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Trae las transacciones existentes de la cuenta en el rango de fechas
   * del archivo, para comparar en memoria (una sola query en vez de N).
   */
  async listExistingForDuplicateCheck(accountId: string, dateFrom: string, dateTo: string): Promise<{ date: string; amount: string; description: string }[]> {
    const { data, error } = await this.supabase
      .from("transactions")
      .select("transaction_date, amount, description")
      .eq("account_id", accountId)
      .gte("transaction_date", dateFrom)
      .lte("transaction_date", dateTo)
      .is("deleted_at", null);
    if (error) throw error;
    return (data ?? []).map((row) => ({ date: row.transaction_date, amount: row.amount, description: row.description }));
  }

  async createBatch(
    userId: string,
    input: {
      accountId: string;
      fileName: string;
      fileType: "CSV" | "XLSX";
      columnMapping: Record<string, unknown>;
      totalRows: number;
    },
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from("import_batches")
      .insert({
        user_id: userId,
        account_id: input.accountId,
        file_name: input.fileName,
        file_type: input.fileType,
        column_mapping: input.columnMapping,
        total_rows: input.totalRows,
        status: "PENDING",
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  }

  async completeBatch(batchId: string, counts: { importedRows: number; duplicateRows: number; errorRows: number }): Promise<void> {
    const { error } = await this.supabase
      .from("import_batches")
      .update({
        status: "CONFIRMED",
        imported_rows: counts.importedRows,
        duplicate_rows: counts.duplicateRows,
        error_rows: counts.errorRows,
      })
      .eq("id", batchId);
    if (error) throw error;
  }
}
