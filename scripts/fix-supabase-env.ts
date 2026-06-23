/**
 * Discovers the correct Supavisor pooler host (aws-0 / aws-1 / aws-2) and updates .env.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import {
  getDatabaseHostname,
  getSupabaseProjectRef,
  isLegacySupabaseDirectHost,
  normalizeSupabaseRegion,
  postgresNeedsSsl,
  toDedicatedTransactionPoolerUrl,
  toSharedPoolerUrlWithPrefix,
  toSharedPoolerUrlWithReferenceOption,
  type SupabasePoolerPrefix,
} from "../lib/db-config";

const REGIONS = [
  "us-east-1",
  "us-east-2",
  "us-west-1",
  "us-west-2",
  "eu-west-1",
  "eu-west-2",
  "eu-central-1",
  "eu-north-1",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ca-central-1",
  "ap-south-1",
  "sa-east-1",
];

const POOLER_PREFIXES: SupabasePoolerPrefix[] = ["aws-0", "aws-1", "aws-2"];

type Candidate = { label: string; url: string; region: string; prefix: SupabasePoolerPrefix };

async function canConnect(connectionString: string): Promise<boolean> {
  const pool = new pg.Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 12_000,
    ssl: postgresNeedsSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await pool.query("SELECT 1");
    await pool.end();
    return true;
  } catch {
    await pool.end();
    return false;
  }
}

function replaceEnvLine(lines: string[], key: string, value: string): string[] {
  const quoted = `${key}="${value.replace(/"/g, '\\"')}"`;
  const index = lines.findIndex((line) => line.startsWith(`${key}=`));
  if (index >= 0) {
    lines[index] = quoted;
  } else {
    lines.push(quoted);
  }
  return lines;
}

function buildCandidates(rawUrl: string, regions: string[]): Candidate[] {
  const candidates: Candidate[] = [];

  if (isLegacySupabaseDirectHost(getDatabaseHostname(rawUrl) ?? "")) {
    candidates.push({
      label: "dedicated pooler :6543",
      url: toDedicatedTransactionPoolerUrl(rawUrl),
      region: "",
      prefix: "aws-0",
    });
  }

  for (const region of regions) {
    for (const prefix of POOLER_PREFIXES) {
      candidates.push({
        label: `${prefix}-${region} (postgres.ref)`,
        url: toSharedPoolerUrlWithPrefix(rawUrl, "transaction", region, prefix),
        region,
        prefix,
      });
      candidates.push({
        label: `${prefix}-${region} (reference option)`,
        url: toSharedPoolerUrlWithReferenceOption(rawUrl, "transaction", region, prefix),
        region,
        prefix,
      });
    }
  }

  return candidates;
}

function sessionUrlForMatch(
  rawUrl: string,
  region: string,
  prefix: SupabasePoolerPrefix,
  transactionUrl: string,
): string {
  if (transactionUrl.includes("options=reference%3D")) {
    return toSharedPoolerUrlWithReferenceOption(rawUrl, "session", region, prefix);
  }
  return toSharedPoolerUrlWithPrefix(rawUrl, "session", region, prefix);
}

async function main() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    console.error("No .env file found. Copy .env.example to .env first.");
    process.exit(1);
  }

  const rawUrl = process.env.DATABASE_URL?.trim();
  if (!rawUrl) {
    console.error("DATABASE_URL is not set in .env");
    process.exit(1);
  }

  const ref = getSupabaseProjectRef(rawUrl);
  if (!ref) {
    console.error("Could not parse Supabase project ref from DATABASE_URL");
    process.exit(1);
  }

  const cliArg = process.argv[2]?.trim();
  let regions = REGIONS;
  let forcedPrefix: SupabasePoolerPrefix | null = null;

  if (cliArg) {
    const prefixMatch = cliArg.match(/^(aws-[0-2])-/);
    if (prefixMatch) {
      forcedPrefix = prefixMatch[1] as SupabasePoolerPrefix;
      regions = [normalizeSupabaseRegion(cliArg)];
    } else {
      regions = [normalizeSupabaseRegion(cliArg)];
    }
  }

  console.log(`Finding Supavisor pooler for project ${ref}...`);

  let candidates = buildCandidates(rawUrl, regions);
  if (forcedPrefix) {
    candidates = candidates.filter((c) => c.prefix === forcedPrefix);
  }

  let matched: Candidate | null = null;

  for (const candidate of candidates) {
    process.stdout.write(`  trying ${candidate.label}...`);
    if (await canConnect(candidate.url)) {
      console.log(" ok");
      matched = candidate;
      break;
    }
    console.log(" no");
  }

  if (!matched) {
    console.error(
      "\nCould not connect with any known pooler host.\n" +
        "• Unpause the project in Supabase dashboard if it was paused\n" +
        "• Reset database password and update .env\n" +
        "• Copy exact pooler host from Dashboard → Connect (may be aws-1 or aws-2, not aws-0)\n" +
        "• Or pass region: npm run db:fix-env -- us-east-2\n" +
        "• Or pass full host prefix: npm run db:fix-env -- aws-1-us-east-2",
    );
    process.exit(1);
  }

  const directUrl = sessionUrlForMatch(
    rawUrl,
    matched.region,
    matched.prefix,
    matched.url,
  );

  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  replaceEnvLine(lines, "DATABASE_URL", matched.url);
  replaceEnvLine(lines, "DIRECT_URL", directUrl);
  replaceEnvLine(lines, "SUPABASE_DB_REGION", normalizeSupabaseRegion(matched.region));
  replaceEnvLine(lines, "SUPABASE_POOLER_PREFIX", matched.prefix);
  fs.writeFileSync(envPath, lines.join("\n"));

  console.log(
    `\nUpdated .env (pooler: ${matched.prefix}-${normalizeSupabaseRegion(matched.region)}).`,
  );
  console.log("Run: npm run db:check && npm run dev");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
