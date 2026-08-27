/**
 * Guía de cancelación: mapa best-effort de proveedores comunes → dónde
 * cancelar. NO es cancelación automática (eso requeriría credenciales del
 * usuario en cada servicio o un partnership tipo Rocket Money — fuera de
 * alcance, ver conversación de producto) — sólo ahorra la búsqueda.
 *
 * Los enlaces son a páginas de cuenta/gestión de cada proveedor, no a
 * flujos de cancelación específicos (más estables en el tiempo, aunque
 * pueden quedar desactualizados igual — es un best-effort, no una garantía).
 * Match por substring case-insensitive contra `provider` o `name` de la
 * suscripción, así que "Netflix Premium" o "netflix" matchean igual.
 */
interface CancellationEntry {
  match: string;
  label: string;
  url?: string;
  note?: string;
}

const CANCELLATION_GUIDE: CancellationEntry[] = [
  { match: "netflix", label: "Netflix", url: "https://www.netflix.com/account" },
  { match: "spotify", label: "Spotify", url: "https://www.spotify.com/account/subscription/" },
  { match: "disney", label: "Disney+", url: "https://www.disneyplus.com/account/subscription" },
  { match: "youtube", label: "YouTube Premium", url: "https://www.youtube.com/paid_memberships" },
  { match: "amazon prime", label: "Amazon Prime", url: "https://www.amazon.com/gp/primecentral" },
  { match: "prime video", label: "Amazon Prime", url: "https://www.amazon.com/gp/primecentral" },
  { match: "hbo", label: "HBO Max / Max", url: "https://www.max.com/account" },
  { match: "max", label: "HBO Max / Max", url: "https://www.max.com/account" },
  { match: "chatgpt", label: "ChatGPT Plus", note: "Cancela desde la app: Configuración → Mi plan." },
  { match: "openai", label: "ChatGPT Plus", note: "Cancela desde la app: Configuración → Mi plan." },
  { match: "icloud", label: "Apple iCloud+", url: "https://support.apple.com/en-us/HT207594" },
  { match: "apple one", label: "Apple One", url: "https://support.apple.com/en-us/HT207594" },
  { match: "apple music", label: "Apple Music", url: "https://support.apple.com/en-us/HT202039" },
  { match: "google one", label: "Google One", url: "https://one.google.com/settings" },
  { match: "microsoft 365", label: "Microsoft 365", url: "https://account.microsoft.com/services" },
  { match: "office 365", label: "Microsoft 365", url: "https://account.microsoft.com/services" },
  { match: "xbox", label: "Xbox Game Pass", url: "https://account.microsoft.com/services" },
  { match: "playstation", label: "PlayStation Plus", url: "https://www.playstation.com/account/subscriptions/" },
  { match: "movistar", label: "Movistar", note: "Cancela llamando a atención al cliente o desde la app Mi Movistar." },
  { match: "claro", label: "Claro", note: "Cancela llamando a atención al cliente o desde Mi Claro." },
  { match: "entel", label: "Entel", note: "Cancela llamando a atención al cliente o desde Mi Entel." },
];

export interface CancellationInfo {
  label: string;
  url?: string;
  note?: string;
}

export function findCancellationInfo(subscriptionName: string, provider: string | null): CancellationInfo | null {
  const haystack = `${subscriptionName} ${provider ?? ""}`.toLowerCase();
  const entry = CANCELLATION_GUIDE.find((candidate) => haystack.includes(candidate.match));
  if (!entry) return null;
  return { label: entry.label, url: entry.url, note: entry.note };
}
