import "dotenv/config";
import { lookup } from "node:dns/promises";
import {
  getAppDatabaseUrl,
  getDatabaseHostname,
  getMigrationDatabaseUrl,
  isEnvPlaceholder,
  isLegacySupabaseDirectHost,
  resolveAppDatabaseUrl,
  validateAuthEnv,
} from "../lib/db-config";

async function main() {
  let ok = true;

  try {
    const rawUrl = process.env.DATABASE_URL?.trim() ?? "";
    const appUrl = getAppDatabaseUrl();
    console.log("✓ DATABASE_URL is valid PostgreSQL");

    const rawHostname = getDatabaseHostname(rawUrl);
    if (rawHostname && isLegacySupabaseDirectHost(rawHostname)) {
      console.warn(
        "⚠ DATABASE_URL uses db.*.supabase.co (direct / often IPv6-only).",
      );
      console.warn("  Run: npm run db:fix-env");
    }

    const hostname = getDatabaseHostname(appUrl);
    if (hostname) {
      if (hostname.includes(":")) {
        console.log(`✓ DATABASE_URL uses IPv6 literal (${hostname})`);
      } else {
        try {
          await lookup(hostname);
          console.log(`✓ DATABASE_URL host resolves (${hostname})`);
        } catch {
          ok = false;
          console.error(
            `✗ DATABASE_URL host does not resolve: ${hostname}\n` +
              "  Copy fresh connection strings from Supabase → Settings → Database.",
          );
        }
      }
    }

    if (rawUrl && process.env.SUPABASE_DB_REGION?.trim()) {
      const upgraded = resolveAppDatabaseUrl(rawUrl);
      const upgradedHost = getDatabaseHostname(upgraded);
      if (upgradedHost && !isLegacySupabaseDirectHost(upgradedHost)) {
        console.log("✓ Legacy URL upgraded via SUPABASE_DB_REGION");
      }
    } else if (rawHostname && isLegacySupabaseDirectHost(rawHostname)) {
      const upgradedHost = getDatabaseHostname(appUrl);
      if (!upgradedHost?.includes(":")) {
        ok = false;
        console.error(
          "✗ Legacy db.*.supabase.co URL — could not resolve IPv6. Run: npm run db:fix-env",
        );
      }
    }
  } catch (error) {
    ok = false;
    console.error("✗ DATABASE_URL:", error instanceof Error ? error.message : error);
  }

  try {
    getMigrationDatabaseUrl();
    console.log("✓ Migration URL available");
  } catch (error) {
    ok = false;
    console.error("✗ Migrations:", error instanceof Error ? error.message : error);
  }

  if (isEnvPlaceholder(process.env.DATABASE_URL) || isEnvPlaceholder(process.env.DIRECT_URL)) {
    ok = false;
    console.error(
      "✗ Placeholders detected in .env — replace [PROJECT-REF], [PASSWORD], and [REGION] with real Supabase values.",
    );
  }

  try {
    validateAuthEnv();
    console.log("✓ AUTH_SECRET is set");
  } catch (error) {
    ok = false;
    console.error("✗ AUTH_SECRET:", error instanceof Error ? error.message : error);
  }

  if (!ok) {
    console.error("\nFix .env and see supabase/README.md");
    process.exit(1);
  }

  console.log("\nEnvironment looks good. Run: npm run db:setup");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
