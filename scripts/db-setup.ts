import "dotenv/config";
import { execSync } from "node:child_process";
import { getAppDatabaseUrl, validateAuthEnv } from "../lib/db-config";

try {
  getAppDatabaseUrl();
  validateAuthEnv();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  console.error("\nSee supabase/README.md for setup instructions.");
  process.exit(1);
}

console.log("Applying database migrations to Supabase...");
execSync("tsx scripts/migrate-deploy.ts", { stdio: "inherit" });

console.log("Seeding demo data...");
execSync("tsx prisma/seed.ts", { stdio: "inherit" });

console.log("\nSetup complete. Demo accounts:");
console.log("  Actor:   maya@forecast.com / password123");
console.log("  Casting: rachel@forecast.com / password123");
