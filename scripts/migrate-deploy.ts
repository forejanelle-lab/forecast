import "dotenv/config";
import { execSync } from "node:child_process";
import { getMigrationDatabaseUrl } from "../lib/db-config";

const migrationUrl = getMigrationDatabaseUrl();

execSync("npx prisma migrate deploy", {
  env: { ...process.env, DATABASE_URL: migrationUrl },
  stdio: "inherit",
});
