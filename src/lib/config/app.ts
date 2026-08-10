/**
 * Constantes de configuración de la aplicación. Ninguna clave secreta vive
 * aquí — sólo defaults públicos y no sensibles.
 */
export const appConfig = {
  name: "STOKA Finance",
  tagline: "Personal Financial Intelligence",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  defaultCurrency: (process.env.NEXT_PUBLIC_DEFAULT_CURRENCY ?? "PEN") as string,
  defaultTimezone: process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE ?? "America/Lima",
  defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? "es-PE",
} as const;

/** Símbolos de moneda soportados. PEN es el default; el resto queda preparado. */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  PEN: "S/",
  USD: "$",
  EUR: "€",
};

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}
