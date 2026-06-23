# Fore Cast

The modern operating system for the entertainment industry — connecting actors and casting directors.

## Quick Start (Supabase)

### 1. Install

```bash
npm install
cp .env.example .env
```

### 2. Configure Supabase

```bash
npm run db:check
```

Add your Supabase connection strings to `.env` (see [supabase/README.md](./supabase/README.md)):

- `DATABASE_URL` — pooler URL (port 6543, `?pgbouncer=true`)
- `DIRECT_URL` — direct URL (port 5432) for migrations
- `AUTH_SECRET` — generate with `openssl rand -base64 32`

### 3. Create tables & seed demo data

```bash
npm run db:setup
```

This runs migrations against Supabase and seeds demo accounts.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Accounts

Password for every account: `password123`

### Casting directors

| Name | Email |
|------|-------|
| Rachel Morrison | `rachel@forecast.com` |
| Derek Walsh | `derek@forecast.com` |

### Actors

| Name | Email |
|------|-------|
| Maya Chen | `maya@forecast.com` |
| Janelle Fore | `janelle@forecast.com` |
| Marcus Rivera | `marcus@forecast.com` |
| Elena Brooks (Premium) | `elena@forecast.com` |

Re-seed anytime with `npm run db:seed` (clears all data and reloads mock data).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:setup` | Apply migrations + seed |
| `npm run db:migrate:deploy` | Apply migrations only |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |

## Stack

- **Next.js 16** — App Router
- **Auth.js** — Credentials + JWT sessions
- **Prisma + Supabase PostgreSQL** — Database
- **Tailwind CSS v4** — Styling

## Database docs

Full Supabase setup (SQL editor, connection strings, troubleshooting): [supabase/README.md](./supabase/README.md)
