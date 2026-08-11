export type AssetType = "CASH" | "ACCOUNT" | "INVESTMENT" | "PROPERTY" | "VEHICLE" | "OTHER";
export type LiabilityType = "CREDIT_CARD" | "LOAN" | "MORTGAGE" | "OTHER";

export interface Asset {
  id: string;
  name: string;
  assetType: AssetType;
  currentValue: string;
  currency: string;
  notes: string | null;
}

export interface Liability {
  id: string;
  name: string;
  liabilityType: LiabilityType;
  currentBalance: string;
  currency: string;
  notes: string | null;
}

export interface NetWorthBreakdownItem {
  label: string;
  amount: string;
}

export interface NetWorthOverview {
  totalAssets: string;
  totalLiabilities: string;
  netWorth: string;
  /** Sólo los totales derivados del sistema (cuentas, tarjetas, préstamos) — sin duplicar los manuales. */
  systemAssetBreakdown: NetWorthBreakdownItem[];
  systemLiabilityBreakdown: NetWorthBreakdownItem[];
  manualAssets: Asset[];
  manualLiabilities: Liability[];
}

export interface SnapshotPoint {
  date: string;
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
}

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  CASH: "Efectivo",
  ACCOUNT: "Cuenta",
  INVESTMENT: "Inversión",
  PROPERTY: "Propiedad",
  VEHICLE: "Vehículo",
  OTHER: "Otro",
};

export const LIABILITY_TYPE_LABELS: Record<LiabilityType, string> = {
  CREDIT_CARD: "Tarjeta de crédito",
  LOAN: "Préstamo",
  MORTGAGE: "Hipoteca",
  OTHER: "Otro",
};
