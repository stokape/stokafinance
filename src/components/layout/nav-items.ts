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
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/accounts", label: "Cuentas", icon: Wallet },
  { href: "/budgets", label: "Presupuesto", icon: PiggyBank },
  { href: "/bills", label: "Pagos", icon: Receipt },
  { href: "/cards", label: "Tarjetas", icon: CreditCard },
  { href: "/loans", label: "Deudas", icon: Landmark },
  { href: "/subscriptions", label: "Suscripciones", icon: Repeat },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/net-worth", label: "Patrimonio", icon: TrendingUp },
  { href: "/forecast", label: "Proyecciones", icon: LineChart },
  { href: "/reports", label: "Reportes", icon: FileBarChart },
  { href: "/settings", label: "Configuración", icon: Settings },
];
