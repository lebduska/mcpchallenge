# Contributing to MCP Challenge

## Development Setup

```bash
npm install
npm run dev
```

## Environments

| Branch | URL | Description |
|--------|-----|-------------|
| `main` | https://mcpchallenge.org | Production |
| `dev` | https://dev.mcpchallenge.org | Development/staging |

## Deployment

### Automatic (CI/CD)

Push to `main` or `dev` branch triggers automatic deployment via GitHub Actions.

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

## Dev Workflow

1. Create feature branch from `dev`:
   ```bash
   git checkout dev
   git pull
   git checkout -b feature/my-feature
   ```

2. Make changes and push:
   ```bash
   git add .
   git commit -m "feat: My feature"
   git push -u origin feature/my-feature
   ```

3. Merge to `dev` for testing:
   ```bash
   git checkout dev
   git merge feature/my-feature
   git push
   ```
   → Auto-deploys to https://dev.mcpchallenge.org

4. After testing, merge to `main`:
   ```bash
   git checkout main
   git merge dev
   git push
   ```
   → Auto-deploys to https://mcpchallenge.org

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Hosting:** Cloudflare Pages
- **Database:** Cloudflare D1 (SQLite)
- **Auth:** NextAuth.js v5 (Google, GitHub)
- **ORM:** Drizzle
- **i18n:** next-intl (25 languages)
