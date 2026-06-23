import "dotenv/config";
import { prisma } from "../lib/prisma";

/**
 * Deletes all application data while keeping schema and migrations intact.
 * Does not touch _prisma_migrations.
 */
async function listPublicTables(): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
    ORDER BY tablename
  `;

  return rows.map((row) => row.tablename);
}

async function clearAllData(): Promise<void> {
  const tables = await listPublicTables();
  if (tables.length === 0) {
    console.log("No application tables found.");
    return;
  }

  const quoted = tables.map((table) => `"${table}"`).join(", ");
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE;`,
  );
}

async function main() {
  console.log("Clearing all Supabase data (schema preserved)...");
  const tables = await listPublicTables();
  console.log(`Truncating ${tables.length} tables...`);
  await clearAllData();
  console.log("Done — database is empty.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
