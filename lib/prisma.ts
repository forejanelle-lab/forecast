import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import pg from "pg";
import {
  getAppDatabaseUrl,
  getDatabaseHostname,
  parsePostgresUrl,
  postgresNeedsSsl,
} from "@/lib/db-config";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: pg.Pool | undefined;
};

function createPgPool(connectionString: string): pg.Pool {
  const ssl = postgresNeedsSsl(connectionString)
    ? { rejectUnauthorized: false as const }
    : undefined;

  // pg mishandles IPv6 literals in connection strings; use discrete fields.
  const hostname = getDatabaseHostname(connectionString);
  const poolOptions: pg.PoolConfig = {
    max: 10,
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 20_000,
    maxLifetimeSeconds: 300,
    keepAlive: true,
    ssl,
  };

  if (hostname?.includes(":") && !hostname.includes(".")) {
    const parsed = parsePostgresUrl(connectionString);
    return new pg.Pool({
      ...poolOptions,
      host: hostname,
      port: Number(parsed.port || "5432"),
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, "") || "postgres",
    });
  }

  return new pg.Pool({
    ...poolOptions,
    connectionString,
  });
}

function resetDatabaseClients(): void {
  const pool = globalForPrisma.pgPool;
  globalForPrisma.pgPool = undefined;
  globalForPrisma.prisma = undefined;
  if (pool) {
    pool.end().catch(() => undefined);
  }
}

function getPgPool(connectionString: string): pg.Pool {
  if (!globalForPrisma.pgPool) {
    const pool = createPgPool(connectionString);
    pool.on("error", (error) => {
      console.error("[db] PostgreSQL pool error — resetting clients", error);
      resetDatabaseClients();
    });
    globalForPrisma.pgPool = pool;
  }
  return globalForPrisma.pgPool;
}

function createPrismaClient(): PrismaClient {
  const connectionString = getAppDatabaseUrl();

  const log: ("error" | "warn")[] =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  const pool = getPgPool(connectionString);
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter, log });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
