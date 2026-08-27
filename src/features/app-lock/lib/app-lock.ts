/**
 * "Bloqueo biométrico" — IMPORTANTE, qué es y qué NO es:
 *
 * Es un candado de CONVENIENCIA, 100% local al dispositivo/navegador, que
 * pide Face ID/huella/Windows Hello (vía WebAuthn, `authenticatorAttachment:
 * "platform"`) antes de mostrar el contenido de la app. Evita que alguien
 * que toma tu teléfono ya desbloqueado (o tu PWA ya con sesión iniciada) vea
 * tus finanzas sin más.
 *
 * NO es un segundo factor de autenticación real: la credencial WebAuthn se
 * crea y se verifica ENTERAMENTE en el navegador (`navigator.credentials`),
 * nunca se manda al servidor, no hay verificación de firma contra una clave
 * pública guardada en la base de datos. La seguridad real de la cuenta
 * sigue siendo, únicamente, la cookie de sesión de Supabase (httpOnly,
 * secure) — este candado no la reemplaza ni la refuerza a nivel de
 * servidor, sólo agrega una fricción local antes de RENDERIZAR la UI.
 *
 * Por eso, si se borra el localStorage del navegador (modo incógnito,
 * "borrar datos de navegación", etc.), el candado simplemente desaparece
 * (fail-open) — es la decisión correcta para una feature de conveniencia:
 * lo contrario dejaría a alguien fuera de su propia app financiera por
 * perder el storage local, sin ningún mecanismo de recuperación posible
 * (no hay nada guardado en el servidor que permita reconciliar esto).
 */

const CREDENTIAL_ID_KEY = "stoka_app_lock_credential_id";
const ENABLED_KEY = "stoka_app_lock_enabled";
const SESSION_UNLOCKED_KEY = "stoka_app_lock_unlocked";

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeSessionStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function isAppLockSupported(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential && !!navigator.credentials;
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isAppLockSupported() || !window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function isAppLockEnabled(): boolean {
  const storage = safeLocalStorage();
  return !!storage && storage.getItem(ENABLED_KEY) === "true" && !!storage.getItem(CREDENTIAL_ID_KEY);
}

export function isUnlockedThisSession(): boolean {
  return safeSessionStorage()?.getItem(SESSION_UNLOCKED_KEY) === "true";
}

export function markUnlockedThisSession(): void {
  safeSessionStorage()?.setItem(SESSION_UNLOCKED_KEY, "true");
}

export function disableAppLock(): void {
  const local = safeLocalStorage();
  local?.removeItem(CREDENTIAL_ID_KEY);
  local?.removeItem(ENABLED_KEY);
  safeSessionStorage()?.removeItem(SESSION_UNLOCKED_KEY);
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBuffer(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = window.atob(padded);
  const output = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) output[i] = binary.charCodeAt(i);
  return output;
}

function randomChallenge(): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return bytes;
}

export async function registerAppLockCredential(userId: string, email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isAppLockSupported()) return { ok: false, error: "Tu navegador no soporta bloqueo biométrico." };

  try {
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge: randomChallenge(),
        rp: { name: "STOKA Finance" },
        user: { id: new TextEncoder().encode(userId), name: email, displayName: email },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "preferred" },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!credential) return { ok: false, error: "No se pudo crear la credencial." };

    const local = safeLocalStorage();
    if (!local) return { ok: false, error: "No se puede guardar el bloqueo en este navegador (almacenamiento local bloqueado)." };

    local.setItem(CREDENTIAL_ID_KEY, bufferToBase64url(credential.rawId));
    local.setItem(ENABLED_KEY, "true");
    markUnlockedThisSession();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo activar el bloqueo biométrico." };
  }
}

export async function verifyAppLock(): Promise<boolean> {
  const storedId = safeLocalStorage()?.getItem(CREDENTIAL_ID_KEY);
  if (!storedId) return false;

  try {
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: randomChallenge(),
        allowCredentials: [{ id: base64urlToBuffer(storedId), type: "public-key" }],
        userVerification: "required",
        timeout: 60000,
      },
    });
    return !!credential;
  } catch {
    return false;
  }
}
