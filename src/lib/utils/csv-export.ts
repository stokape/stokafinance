/**
 * Utilidades de exportación CSV client-side, compartidas por cualquier
 * feature que exporte datos a CSV (hoy: Reportes).
 *
 * SECURITY-08: neutraliza CSV/Formula Injection (CWE-1236). Un campo cuyo
 * valor empiece con `=`, `+`, `-`, `@`, tab o retorno de carro es
 * interpretado como fórmula por Excel/Sheets al abrir el archivo — si ese
 * texto viene de datos importados (ej. el nombre de un comercio en un CSV
 * bancario) podría ejecutar código o exfiltrar datos vía HYPERLINK/WEBSERVICE
 * al reexportarse. Se antepone un apóstrofe para forzarlo a texto plano,
 * igual que hace Excel al pegar como texto.
 */
const FORMULA_TRIGGER_CHARS = new Set(["=", "+", "-", "@", "\t", "\r"]);

export function neutralizeCsvFormula(value: string): string {
  if (value.length > 0 && FORMULA_TRIGGER_CHARS.has(value[0])) {
    return `'${value}`;
  }
  return value;
}

export function escapeCsvField(value: string): string {
  const neutralized = neutralizeCsvFormula(value);
  if (/[",\n]/.test(neutralized)) return `"${neutralized.replace(/"/g, '""')}"`;
  return neutralized;
}

export function buildCsv(header: string[], rows: string[][]): string {
  const escapedRows = rows.map((row) => row.map((field) => escapeCsvField(field)).join(","));
  return [header.map((h) => escapeCsvField(h)).join(","), ...escapedRows].join("\n");
}

/** Dispara la descarga de un CSV en el navegador (BOM incluido para Excel). */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
