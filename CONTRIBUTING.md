# Contributing to MCP Challenge

## Development Setup

```bash
npm install
npm run dev
```

## Deployment

### Automatic (CI/CD)

Push to `main` branch triggers automatic deployment via GitHub Actions.

**Required GitHub Secrets:**
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token with Pages edit permissions
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID (`452df83824c135204a1114610ae6dc49`)

### Manual Deployment

**IMPORTANT:** Do NOT use `wrangler pages deploy .next` directly - it doesn't work with Next.js App Router.

Use the correct build pipeline:

```bash
# 1. Build with @cloudflare/next-on-pages
npx @cloudflare/next-on-pages

# 2. Deploy the output
npx wrangler pages deploy .vercel/output/static --project-name=mcpchallenge
```

Or use the npm script:

```bash
npm run deploy
```

### Database Migrations

```bash
# Generate migration
npm run db:generate

# Apply to remote D1
CLOUDFLARE_EMAIL="..." CLOUDFLARE_API_KEY="..." npx wrangler d1 execute mcpchallenge-db --remote --file=drizzle/migrations/XXXX_migration.sql
```

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Hosting:** Cloudflare Pages
- **Database:** Cloudflare D1 (SQLite)
- **Auth:** NextAuth.js v5 (Google, GitHub)
- **ORM:** Drizzle
- **i18n:** next-intl (25 languages)
