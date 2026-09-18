import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CsvImportWizard } from "@/features/csv-import/components/csv-import-wizard";

export const metadata: Metadata = { title: "Importar movimientos" };

export default function ImportTransactionsPage() {
  return (
    <div className="space-y-4">
      <Link href="/transactions" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver a movimientos
      </Link>
      <div>
        <h1 className="text-xl font-semibold">Importar movimientos</h1>
        <p className="text-sm text-muted-foreground">Sube un archivo CSV exportado de tu banco.</p>
      </div>
      <CsvImportWizard />
    </div>
  );
}
