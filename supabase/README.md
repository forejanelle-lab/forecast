# Supabase Setup

Fore Cast uses **Supabase PostgreSQL** for all tables. Choose one of the setup methods below.

## 1. Get your connection strings

In the [Supabase Dashboard](https://supabase.com/dashboard):

1. Open your project → **Settings** → **Database**
2. Copy **Connection string** → **URI** (Transaction pooler, port **6543**) → `DATABASE_URL`
3. Copy **Connection string** → **URI** (Session/direct, port **5432**) → `DIRECT_URL`

Verify your `.env` before migrating:

```bash
npm run db:check
```

Add both to `.env`:

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
AUTH_SECRET="your-secret-here"
AUTH_URL="http://localhost:3000"
# Set ACTOR_PUBLIC_AUTH_ENABLED=true to enable actor sign-up/sign-in buttons
```

## 2. Create tables

### Option A — Prisma CLI (recommended)

```bash
npm run db:migrate:deploy
npm run db:seed
```

This applies all migrations in `prisma/migrations/` to your Supabase database.

### Option B — Supabase SQL Editor

1. Open **SQL Editor** in the Supabase Dashboard
2. Run [`schema.sql`](./schema.sql) (base tables) if the database is empty
3. Run [`migrations/20250618120000_actor_casting_tables.sql`](./migrations/20250618120000_actor_casting_tables.sql) (actor & casting extensions)
4. Mark migrations as applied locally:

```bash
npx prisma migrate resolve --applied 20250617120000_init
npx prisma migrate resolve --applied 20250618120000_actor_casting_tables
npm run db:seed
```

## Tables

### Core (auth & projects)

| Table | Description |
|-------|-------------|
| `User` | Accounts (actors & casting directors) |
| `Account`, `Session`, `VerificationToken` | Auth.js |
| `Project`, `Role` | Casting projects & roles |
| `Application`, `SavedRole` | Actor role submissions |
| `Audition` | Audition requests |
| `Message`, `Notification` | Direct messages & alerts |

### Actor side

| Table | Description |
|-------|-------------|
| `ActorProfile` | Bio, skills, languages, locations, height, photos, onboarding |
| `ActorHeadshot` | Up to 2 headshots per actor |
| `ActorMedia` | Demo reels, performance videos, audio/documents |
| `ActorLink` | IMDb, website, reel links |
| `Credit` | Acting credits on profile |
| `AuditionSubmissionItem` | Self-tape files per audition request |

### Casting side

| Table | Description |
|-------|-------------|
| `CastingProfile` | Office name, phone, address, photo, onboarding |
| `Conversation` | Per-project thread between casting and actor |
| `ConversationMessage` | Messages inside a conversation |

## Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Actor | `maya@forecast.com` | `password123` |
| Casting | `rachel@forecast.com` | `password123` |

## Troubleshooting

- **SSL errors** — Supabase requires SSL; the app enables it automatically for `supabase.com` URLs.
- **Migration fails on pooler** — Use `DIRECT_URL` (port 5432) for migrations, not the pooler URL.
- **P1001 Can't reach database** — Check project is not paused and password is correct.
- **Legacy `db.*.supabase.co` URL** — Direct hosts are IPv6-only on many networks. Run `npm run db:fix-env` to auto-discover your pooler host (may be `aws-1` or `aws-2`, not `aws-0`).
- **Tenant or user not found** — Wrong pooler cluster host. Run `npm run db:fix-env` or copy the exact host from Dashboard → Connect (e.g. `aws-1-us-west-2.pooler.supabase.com`).
- **Enum already exists** — Use the incremental SQL in `supabase/migrations/` (safe re-runs with `IF NOT EXISTS`).
