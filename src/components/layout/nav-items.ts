import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PiggyBank,
  Receipt,
  CreditCard,
  Landmark,
  Repeat,
  Target,
  TrendingUp,
  LineChart,
  FileBarChart,
  Settings,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Módulos aún no implementados: la página existe pero muestra un placeholder honesto (roadmap). */
  status: "ready" | "planned";
}

/** Navegación principal (§5/§10). El orden importa: refleja el roadmap de fases. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, status: "ready" },
  { href: "/transactions", label: "Movimientos", icon: ArrowLeftRight, status: "ready" },
  { href: "/accounts", label: "Cuentas", icon: Wallet, status: "ready" },
  { href: "/budgets", label: "Presupuesto", icon: PiggyBank, status: "ready" },
  { href: "/bills", label: "Pagos", icon: Receipt, status: "ready" },
  { href: "/cards", label: "Tarjetas", icon: CreditCard, status: "ready" },
  { href: "/loans", label: "Deudas", icon: Landmark, status: "ready" },
  { href: "/subscriptions", label: "Suscripciones", icon: Repeat, status: "ready" },
  { href: "/goals", label: "Metas", icon: Target, status: "planned" },
  { href: "/net-worth", label: "Patrimonio", icon: TrendingUp, status: "planned" },
  { href: "/forecast", label: "Proyecciones", icon: LineChart, status: "planned" },
  { href: "/reports", label: "Reportes", icon: FileBarChart, status: "planned" },
  { href: "/settings", label: "Configuración", icon: Settings, status: "ready" },
];
