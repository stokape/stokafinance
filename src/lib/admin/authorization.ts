import "server-only";

const DEFAULT_ADMIN_EMAILS = ["contacto@stoka.pe"];

function configuredAdminEmails(): string[] {
  const configured = process.env.ADMIN_EMAILS
    ?.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return configured?.length ? configured : DEFAULT_ADMIN_EMAILS;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return configuredAdminEmails().includes(email.trim().toLowerCase());
}
