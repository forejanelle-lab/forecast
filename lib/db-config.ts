import { execFileSync } from "node:child_process";

const SQLITE_ERROR =
  "DATABASE_URL points to SQLite (file:...) but Fore Cast uses Supabase PostgreSQL.\n" +
  "Update .env with your Supabase connection strings — see supabase/README.md";

const PLACEHOLDER_ERROR =
  ".env still has placeholder values ([PROJECT-REF], [PASSWORD], etc.).\n" +
  "Replace them with your real Supabase connection strings from the dashboard.";

export function isEnvPlaceholder(value?: string): boolean {
  if (!value) return false;
  return /\[PROJECT-REF\]|\[PASSWORD\]|\[REGION\]/i.test(value);
}

export function validateDatabaseEnv(): void {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const directUrl = process.env.DIRECT_URL?.trim();

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and add your Supabase credentials.",
    );
  }

  if (isEnvPlaceholder(databaseUrl) || isEnvPlaceholder(directUrl)) {
    throw new Error(PLACEHOLDER_ERROR);
  }

  if (databaseUrl.startsWith("file:")) {
    throw new Error(SQLITE_ERROR);
  }

  if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
    throw new Error("DATABASE_URL must be a PostgreSQL connection string.");
  }
}

function resolveSupabaseIPv6(hostname: string): string | null {
  try {
    const out = execFileSync("dig", ["+short", hostname, "AAAA"], {
      encoding: "utf8",
      timeout: 5000,
    }).trim();
    return out.split("\n").find((line) => line.includes(":")) ?? null;
  } catch {
    return null;
  }
}

/** Use IPv6 literal when db.*.supabase.co only publishes AAAA (common on Supabase). */
export function toIPv6LiteralConnectionString(url: string): string {
  const hostname = getDatabaseHostname(url);
  if (!hostname || !isLegacySupabaseDirectHost(hostname)) {
    return url;
  }

  const address = resolveSupabaseIPv6(hostname);
  if (!address) return url;

  const parsed = parsePostgresUrl(url);
  const port = parsed.port || "5432";
  const database = parsed.pathname || "/postgres";
  const user = encodeURIComponent(parsed.username);
  const pass = encodeURIComponent(parsed.password);

  return `postgresql://${user}:${pass}@[${address}]:${port}${database}`;
}

export function getAppDatabaseUrl(): string {
  validateDatabaseEnv();
  let url = resolveAppDatabaseUrl(process.env.DATABASE_URL!.trim());
  url = toIPv6LiteralConnectionString(url);
  validateAppDatabaseUrlFormat(url);
  return url;
}

export function getMigrationDatabaseUrl(): string {
  validateDatabaseEnv();

  const directUrl = process.env.DIRECT_URL?.trim();
  const databaseUrl = process.env.DATABASE_URL!.trim();

  if (directUrl) {
    return resolveMigrationDatabaseUrl(directUrl);
  }

  if (databaseUrl && isDirectPostgresUrl(databaseUrl)) {
    console.warn(
      "DIRECT_URL not set — using DATABASE_URL for migrations (direct connection detected).",
    );
    return databaseUrl;
  }

  if (databaseUrl?.startsWith("file:")) {
    throw new Error(SQLITE_ERROR);
  }

  throw new Error(
    "DIRECT_URL is required for migrations when using a Supabase pooler URL.\n" +
      "Add DIRECT_URL to .env (Session mode, port 5432) — see supabase/README.md",
  );
}

export function isDirectPostgresUrl(url: string): boolean {
  if (url.includes("pgbouncer=true")) return false;
  if (url.includes(":6543/")) return false;
  return url.startsWith("postgresql://") || url.startsWith("postgres://");
}

export function postgresNeedsSsl(url: string): boolean {
  return url.includes("supabase.com") || url.includes("sslmode=require");
}

export function getDatabaseHostname(url: string): string | null {
  try {
    return new URL(url.replace(/^postgres:/, "postgresql:")).hostname;
  } catch {
    const match = url.match(/@([^/:?]+)/);
    return match?.[1] ?? null;
  }
}

export function isLegacySupabaseDirectHost(hostname: string): boolean {
  return /^db\.[a-z0-9]+\.supabase\.co$/i.test(hostname);
}

export function getLegacySupabaseProjectRef(hostname: string): string | null {
  const match = hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
  return match?.[1] ?? null;
}

export function parsePostgresUrl(url: string): URL {
  return new URL(url.replace(/^postgres:/, "postgresql:"));
}

export type SupabasePoolerPrefix = "aws-0" | "aws-1" | "aws-2";

export function getSupabaseProjectRef(url: string): string | null {
  const hostname = getDatabaseHostname(url);
  if (hostname) {
    const fromHost = getLegacySupabaseProjectRef(hostname);
    if (fromHost) return fromHost;
  }

  const parsed = parsePostgresUrl(url);
  const userMatch = parsed.username.match(/^postgres\.([a-z0-9]+)$/i);
  if (userMatch) return userMatch[1];

  const refMatch = url.match(/options=reference%3D([a-z0-9]+)/i);
  return refMatch?.[1] ?? null;
}

export function parsePoolerPrefixFromHostname(hostname: string): SupabasePoolerPrefix | null {
  const match = hostname.match(/^(aws-[0-2])-/);
  return match ? (match[1] as SupabasePoolerPrefix) : null;
}

export function normalizeSupabaseRegion(region: string): string {
  return region.replace(/^aws-\d+-/, "");
}

export function toSharedPoolerUrlWithPrefix(
  url: string,
  mode: "transaction" | "session",
  region: string,
  poolerPrefix: SupabasePoolerPrefix,
): string {
  const ref = getSupabaseProjectRef(url);
  if (!ref) return url;

  const parsed = parsePostgresUrl(url);
  const normalizedRegion = normalizeSupabaseRegion(region);
  const poolerHost = `${poolerPrefix}-${normalizedRegion}.pooler.supabase.com`;
  const port = mode === "transaction" ? "6543" : "5432";

  parsed.username = `postgres.${ref}`;
  parsed.hostname = poolerHost;
  parsed.port = port;
  parsed.search = mode === "transaction" ? "pgbouncer=true" : "";

  return parsed.toString();
}

/** Default shared pooler helper (aws-0). */
export function toSharedPoolerUrl(
  url: string,
  mode: "transaction" | "session",
  region: string,
): string {
  return toSharedPoolerUrlWithPrefix(url, mode, region, "aws-0");
}

export function toSharedPoolerUrlWithReferenceOption(
  url: string,
  mode: "transaction" | "session",
  region: string,
  poolerPrefix: SupabasePoolerPrefix,
): string {
  const ref = getSupabaseProjectRef(url);
  if (!ref) return url;

  const parsed = parsePostgresUrl(url);
  const normalizedRegion = normalizeSupabaseRegion(region);
  const poolerHost = `${poolerPrefix}-${normalizedRegion}.pooler.supabase.com`;
  const port = mode === "transaction" ? "6543" : "5432";

  parsed.username = "postgres";
  parsed.hostname = poolerHost;
  parsed.port = port;
  parsed.search =
    mode === "transaction"
      ? `pgbouncer=true&options=reference%3D${ref}`
      : `options=reference%3D${ref}`;

  return parsed.toString();
}

/** Dedicated PgBouncer on paid plans: same host, transaction port 6543. */
export function toDedicatedTransactionPoolerUrl(url: string): string {
  const parsed = parsePostgresUrl(url);
  if (!getLegacySupabaseProjectRef(parsed.hostname)) return url;

  parsed.port = "6543";
  parsed.search = "";
  return parsed.toString();
}

export function resolveAppDatabaseUrl(rawUrl: string): string {
  const hostname = getDatabaseHostname(rawUrl);
  if (!hostname || !isLegacySupabaseDirectHost(hostname)) {
    return rawUrl;
  }

  const region = process.env.SUPABASE_DB_REGION?.trim();
  const poolerPrefix =
    (process.env.SUPABASE_POOLER_PREFIX?.trim() as SupabasePoolerPrefix | undefined) ??
    parsePoolerPrefixFromHostname(getDatabaseHostname(rawUrl) ?? "") ??
    "aws-0";

  if (region) {
    console.warn(
      "[db] Upgrading legacy DATABASE_URL to Supavisor pooler using SUPABASE_DB_REGION.",
    );
    return toSharedPoolerUrlWithPrefix(rawUrl, "transaction", region, poolerPrefix);
  }

  console.warn(
    "[db] DATABASE_URL uses db.*.supabase.co (direct / IPv6).\n" +
      "  Using IPv6 literal when available. For IPv4-only networks run: npm run db:fix-env",
  );

  return rawUrl;
}

export function resolveMigrationDatabaseUrl(rawUrl: string): string {
  const hostname = getDatabaseHostname(rawUrl);
  if (!hostname || !isLegacySupabaseDirectHost(hostname)) {
    return rawUrl;
  }

  const region = process.env.SUPABASE_DB_REGION?.trim();
  const poolerPrefix =
    (process.env.SUPABASE_POOLER_PREFIX?.trim() as SupabasePoolerPrefix | undefined) ??
    parsePoolerPrefixFromHostname(getDatabaseHostname(rawUrl) ?? "") ??
    "aws-0";

  if (region) {
    return toSharedPoolerUrlWithPrefix(rawUrl, "session", region, poolerPrefix);
  }

  console.warn(
    "[db] DIRECT_URL uses db.*.supabase.co — run npm run db:fix-env to set the session pooler URL.",
  );
  return toIPv6LiteralConnectionString(rawUrl);
}

export function validateAppDatabaseUrlFormat(url: string): void {
  const hostname = getDatabaseHostname(url);
  if (!hostname) return;

  if (
    hostname.includes("pooler.supabase.com") &&
    url.includes(":6543") &&
    !url.includes("pgbouncer=true")
  ) {
    console.warn(
      "[db] DATABASE_URL uses the pooler on port 6543 but is missing ?pgbouncer=true",
    );
  }
}

export function validateAuthEnv(): void {
  if (!process.env.AUTH_SECRET?.trim()) {
    throw new Error(
      "AUTH_SECRET is not set. Generate one with: openssl rand -base64 32",
    );
  }
}
