import type { ParsedWhatsAppMessage, WhatsAppConfidence } from "../types/whatsapp.types";

/**
 * Parser DETERMINÍSTICO de mensajes de WhatsApp (§37/§38 del prompt
 * zero-cost). A propósito NO usa IA: extrae monto y pistas de cuenta con
 * reglas fijas, exactamente como se especificó ("no es necesario utilizar
 * IA inicialmente"). Sólo se usa hoy en tests — el canal real está
 * deshabilitado (WHATSAPP_ENABLED=false).
 *
 * Ejemplos soportados: "Almuerzo 35 Yape", "Taxi 24.50 efectivo",
 * "Gasolina 150 BCP", "Recibí 6500 sueldo BCP".
 */

const KNOWN_ACCOUNT_KEYWORDS = ["yape", "plin", "efectivo", "bcp", "bbva", "interbank", "scotiabank", "visa", "mastercard"];
const INCOME_KEYWORDS = ["recibi", "ingreso", "sueldo", "cobre"];

const AMOUNT_PATTERN = /\b\d{1,9}(?:[.,]\d{1,2})?\b/;
// Marcas diacríticas combinantes (acentos) tras NFD — U+0300 a U+036F.
const DIACRITICS_PATTERN = /[̀-ͯ]/g;

function normalize(text: string): string {
  return text.normalize("NFD").replace(DIACRITICS_PATTERN, "").toLowerCase();
}

export function parseWhatsAppMessage(rawText: string): ParsedWhatsAppMessage {
  const text = rawText.trim();
  const normalized = normalize(text);

  const amountMatch = text.match(AMOUNT_PATTERN);
  const amount = amountMatch ? amountMatch[0].replace(",", ".") : null;

  const accountHint = KNOWN_ACCOUNT_KEYWORDS.find((keyword) => normalized.includes(keyword)) ?? null;
  const isIncome = INCOME_KEYWORDS.some((keyword) => normalized.includes(keyword));

  let description = text;
  if (amountMatch) description = description.replace(amountMatch[0], " ");
  if (accountHint) {
    description = description.replace(new RegExp(accountHint, "i"), " ");
  }
  description = description.replace(/\s+/g, " ").trim();

  const missingFields: string[] = [];
  if (!amount) missingFields.push("amount");
  if (!accountHint) missingFields.push("account");

  let confidence: WhatsAppConfidence = "LOW";
  if (amount && accountHint) confidence = "HIGH";
  else if (amount) confidence = "MEDIUM";

  return {
    amount,
    accountHint,
    categoryHint: isIncome ? "INCOME" : null,
    description: description || text,
    confidence,
    missingFields,
  };
}
