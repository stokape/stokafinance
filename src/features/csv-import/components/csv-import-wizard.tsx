"use client";

import { useEffect, useState } from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/feedback/skeleton";
import { normalizeCsvRows } from "../utils/csv-normalize";
import { getImportFormOptionsAction, checkImportDuplicatesAction, confirmCsvImportAction } from "../actions/csv-import.actions";
import type { CsvColumnMapping, ImportSummary, PreviewRow, RawCsvRow } from "../types/csv-import.types";
import type { AccountOption, CategoryOption } from "@/features/transactions/components/quick-add-transaction-menu";
import { formatMoney } from "@/lib/utils/money";

type Step = "upload" | "mapping" | "preview" | "done";

export function CsvImportWizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [accountId, setAccountId] = useState("");
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<RawCsvRow[]>([]);

  const [mapping, setMapping] = useState<CsvColumnMapping>({
    dateColumn: "",
    descriptionColumn: "",
    amountColumn: "",
    singleAmountColumn: true,
    debitColumn: "",
    creditColumn: "",
    merchantColumn: "",
  });

  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [defaultExpenseCategoryId, setDefaultExpenseCategoryId] = useState("");
  const [defaultIncomeCategoryId, setDefaultIncomeCategoryId] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  useEffect(() => {
    getImportFormOptionsAction().then((options) => {
      setAccounts(options.accounts);
      setCategories(options.categories);
      setLoadingOptions(false);
    });
  }, []);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedHeaders = results.meta.fields ?? [];
        if (parsedHeaders.length === 0 || results.data.length === 0) {
          toast.error("No pudimos leer columnas en ese archivo. Verifica que sea un CSV con encabezados.");
          return;
        }
        setHeaders(parsedHeaders);
        setRawRows(results.data.map((values, rowIndex) => ({ rowIndex, values })));
        setMapping((prev) => ({
          ...prev,
          dateColumn: parsedHeaders[0] ?? "",
          descriptionColumn: parsedHeaders[1] ?? "",
          amountColumn: parsedHeaders[2] ?? "",
        }));
        setStep("mapping");
      },
      error: () => toast.error("No pudimos leer el archivo. Verifica que sea un CSV válido."),
    });
  }

  async function handleGeneratePreview() {
    const normalized = normalizeCsvRows(rawRows, mapping);
    setIsCheckingDuplicates(true);
    const result = await checkImportDuplicatesAction(accountId, normalized);
    const duplicateFlags = result.ok ? result.data : normalized.map(() => false);

    setPreviewRows(
      normalized.map((row, index) => ({
        ...row,
        isDuplicate: duplicateFlags[index] ?? false,
        hasError: !row.date || !row.amount,
        included: !(duplicateFlags[index] ?? false) && !!row.date && !!row.amount,
      })),
    );
    setIsCheckingDuplicates(false);
    setStep("preview");
  }

  function toggleRow(rowIndex: number) {
    setPreviewRows((prev) => prev.map((r) => (r.rowIndex === rowIndex ? { ...r, included: !r.included } : r)));
  }

  async function handleConfirm() {
    const rowsToImport = previewRows.filter((r) => r.included);
    setIsConfirming(true);
    const result = await confirmCsvImportAction({
      accountId,
      defaultExpenseCategoryId: defaultExpenseCategoryId || null,
      defaultIncomeCategoryId: defaultIncomeCategoryId || null,
      fileName,
      columnMapping: mapping as unknown as Record<string, unknown>,
      rows: rowsToImport,
    });
    setIsConfirming(false);

    if (result.ok) {
      setSummary(result.data);
      setStep("done");
    } else {
      toast.error(result.error);
    }
  }

  const includedCount = previewRows.filter((r) => r.included).length;
  const duplicateCount = previewRows.filter((r) => r.isDuplicate).length;
  const errorCount = previewRows.filter((r) => r.hasError).length;
  const expenseCategories = categories.filter((c) => c.categoryType === "EXPENSE");
  const incomeCategories = categories.filter((c) => c.categoryType === "INCOME");

  if (loadingOptions) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="max-w-3xl space-y-6">
      <StepIndicator step={step} />

      {step === "upload" ? (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-1.5">
              <Label htmlFor="import-account">Cuenta destino</Label>
              <Select id="import-account" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                <option value="" disabled>
                  Selecciona una cuenta
                </option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">Todos los movimientos del archivo se asignarán a esta cuenta.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="import-file">Archivo CSV</Label>
              <label
                htmlFor="import-file"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border p-8 text-center hover:bg-muted"
              >
                <Upload className="h-6 w-6 text-muted-foreground" aria-hidden />
                <span className="text-sm text-muted-foreground">Haz clic para elegir un archivo .csv exportado de tu banco</span>
                <input id="import-file" type="file" accept=".csv,text/csv" className="hidden" disabled={!accountId} onChange={handleFileChange} />
              </label>
              {!accountId ? <p className="text-xs text-muted-foreground">Elige primero una cuenta.</p> : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === "mapping" ? (
        <Card>
          <CardContent className="space-y-4 p-5">
            <p className="text-sm text-muted-foreground">
              {fileName} · {rawRows.length} filas detectadas. Indica qué columna corresponde a cada dato.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="map-date">Columna de fecha</Label>
                <Select id="map-date" value={mapping.dateColumn} onChange={(e) => setMapping((m) => ({ ...m, dateColumn: e.target.value }))}>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="map-description">Columna de descripción</Label>
                <Select
                  id="map-description"
                  value={mapping.descriptionColumn}
                  onChange={(e) => setMapping((m) => ({ ...m, descriptionColumn: e.target.value }))}
                >
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="map-single-amount"
                type="checkbox"
                checked={mapping.singleAmountColumn}
                onChange={(e) => setMapping((m) => ({ ...m, singleAmountColumn: e.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="map-single-amount">Una sola columna de monto (positivo = ingreso, negativo = gasto)</Label>
            </div>

            {mapping.singleAmountColumn ? (
              <div className="space-y-1.5">
                <Label htmlFor="map-amount">Columna de monto</Label>
                <Select id="map-amount" value={mapping.amountColumn} onChange={(e) => setMapping((m) => ({ ...m, amountColumn: e.target.value }))}>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="map-debit">Columna de débito (gasto)</Label>
                  <Select id="map-debit" value={mapping.debitColumn} onChange={(e) => setMapping((m) => ({ ...m, debitColumn: e.target.value }))}>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="map-credit">Columna de crédito (ingreso)</Label>
                  <Select id="map-credit" value={mapping.creditColumn} onChange={(e) => setMapping((m) => ({ ...m, creditColumn: e.target.value }))}>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="map-merchant">Columna de comercio (opcional)</Label>
              <Select id="map-merchant" value={mapping.merchantColumn} onChange={(e) => setMapping((m) => ({ ...m, merchantColumn: e.target.value }))}>
                <option value="">Sin comercio</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                <ArrowLeft className="h-4 w-4" /> Atrás
              </Button>
              <Button onClick={handleGeneratePreview} isLoading={isCheckingDuplicates}>
                Ver vista previa <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === "preview" ? (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span>
                <strong>{includedCount}</strong> a importar
              </span>
              <span className="text-muted-foreground">
                <strong>{duplicateCount}</strong> posibles duplicados (destildados)
              </span>
              {errorCount > 0 ? (
                <span className="text-danger">
                  <strong>{errorCount}</strong> con error de formato
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="default-expense-category">Categoría para gastos (opcional)</Label>
                <Select id="default-expense-category" value={defaultExpenseCategoryId} onChange={(e) => setDefaultExpenseCategoryId(e.target.value)}>
                  <option value="">Sin categoría</option>
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="default-income-category">Categoría para ingresos (opcional)</Label>
                <Select id="default-income-category" value={defaultIncomeCategoryId} onChange={(e) => setDefaultIncomeCategoryId(e.target.value)}>
                  <option value="">Sin categoría</option>
                  {incomeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr className="text-left text-xs font-medium text-muted-foreground">
                    <th className="px-3 py-2"></th>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Descripción</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={row.rowIndex} className="border-t border-border">
                      <td className="px-3 py-1.5">
                        <input
                          type="checkbox"
                          checked={row.included}
                          disabled={row.hasError}
                          onChange={() => toggleRow(row.rowIndex)}
                          className="h-4 w-4 rounded border-input"
                        />
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap">{row.date ?? <span className="text-danger">{row.rawDate || "—"}</span>}</td>
                      <td className="px-3 py-1.5">
                        {row.description}
                        {row.isDuplicate ? <span className="ml-1.5 text-xs text-warning">(duplicado)</span> : null}
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">{row.transactionType === "INCOME" ? "Ingreso" : "Gasto"}</td>
                      <td className="px-3 py-1.5 text-right">
                        {row.amount ? formatMoney(row.amount) : <span className="text-danger">{row.rawAmount || "—"}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep("mapping")}>
                <ArrowLeft className="h-4 w-4" /> Atrás
              </Button>
              <Button onClick={handleConfirm} isLoading={isConfirming} disabled={includedCount === 0}>
                Importar {includedCount} movimiento{includedCount === 1 ? "" : "s"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === "done" && summary ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-success" aria-hidden />
            <p className="font-medium">Importación completada</p>
            <p className="text-sm text-muted-foreground">
              {summary.imported} movimientos importados
              {summary.duplicates > 0 ? `, ${summary.duplicates} duplicados omitidos` : ""}
              {summary.errors > 0 ? `, ${summary.errors} con error` : ""}.
            </p>
            <Button onClick={() => router.push("/transactions")}>Ver movimientos</Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: "1. Archivo" },
    { key: "mapping", label: "2. Mapeo" },
    { key: "preview", label: "3. Vista previa" },
    { key: "done", label: "4. Listo" },
  ];
  const currentIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-2 text-sm">
      {steps.map((s, index) => (
        <span key={s.key} className={index <= currentIndex ? "font-medium text-foreground" : "text-muted-foreground"}>
          {s.label}
          {index < steps.length - 1 ? <span className="mx-2 text-muted-foreground">→</span> : null}
        </span>
      ))}
    </div>
  );
}
