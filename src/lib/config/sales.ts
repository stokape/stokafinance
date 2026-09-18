export const SALES_WHATSAPP_NUMBER = "51986366325";
export const SALES_WHATSAPP_DISPLAY = "+51 986 366 325";
export const SALES_EMAIL = "contacto@stoka.pe";

export const SALES_PLANS = {
  monthly: {
    label: "Mensual",
    price: "S/24.90",
    cadence: "mes",
  },
  annual: {
    label: "Anual",
    price: "S/199",
    cadence: "año",
  },
} as const;

export type SalesPlan = keyof typeof SALES_PLANS;

export function buildSalesWhatsAppUrl(plan?: SalesPlan): string {
  const message = plan
    ? `Hola STOKA, quiero contratar el plan ${SALES_PLANS[plan].label} de ${SALES_PLANS[plan].price} por ${SALES_PLANS[plan].cadence}. Quiero pagar por Yape o transferencia. Mi correo es:`
    : "Hola STOKA, necesito ayuda con la activación o renovación de mi cuenta. Mi correo es:";

  return `https://wa.me/${SALES_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
