function isPrismaConnectionCode(code: unknown): boolean {
  return code === "P1001" || code === "P1000" || code === "P1017";
}

export function isDatabaseConnectionError(error: unknown): boolean {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    isPrismaConnectionCode(error.code)
  ) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Can't reach database server") ||
    message.includes("Connection terminated") ||
    message.includes("ECONNREFUSED") ||
    message.includes("ENOTFOUND") ||
    message.includes("getaddrinfo")
  );
}

export const DATABASE_CONNECTION_HELP =
  "Open Supabase → Project Settings → Database and copy fresh connection strings:\n" +
  "• DATABASE_URL → Transaction pooler (port 6543, include ?pgbouncer=true)\n" +
  "• DIRECT_URL → Session pooler (port 5432)\n\n" +
  "Then run: npm run db:check";
