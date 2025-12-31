# Webcomic Blueprint

A monorepo template for building webcomic websites with:
- **Astro** - Static site generation with SSR support
- **Cloudflare Pages** - Hosting for the public site
- **Cloudflare Workers** - API for admin operations
- **Sanity** - Headless CMS for comic storage and management
- **Sanity Studio** - Web UI for creating and editing comics

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/ericvanlare/webcomic-blueprint.git my-webcomic
cd my-webcomic
pnpm install
```

### 2. Set Up Sanity

1. Go to [sanity.io/manage](https://sanity.io/manage) and create a new project
2. Note your **Project ID** (looks like `abc123xy`)
3. Create an API token with **Editor** permissions (Settings → API → Tokens)

### 3. Configure Sanity Studio

Edit these files with your Project ID:
- `sanity-studio/sanity.config.ts` - Replace `YOUR_PROJECT_ID`
- `sanity-studio/sanity.cli.ts` - Replace `YOUR_PROJECT_ID`

### 4. Configure Environment

**For the site (Cloudflare runtime vars):**
```bash
cp apps/site/.dev.vars.example apps/site/.dev.vars
# Edit apps/site/.dev.vars with your SANITY_PROJECT_ID
```

**For the worker (local dev):**
```bash
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
# Edit apps/worker/.dev.vars with your Sanity credentials
```

### 5. Build and Run

```bash
# Build shared types (required first time)
pnpm --filter @webcomic/shared build

# Start dev servers
pnpm dev
```

This starts:
- Astro site at `http://localhost:4321`
- Worker API at `http://localhost:8787`

### 6. Run Sanity Studio

```bash
cd sanity-studio
npm install
npm run dev
```

Opens at `http://localhost:3333` - use this to create your first comic!

---

## Repository Structure

```
webcomic-blueprint/
├── apps/
│   ├── site/           # Astro site (public pages + admin UI)
│   │   └── src/
│   │       ├── layouts/    # BaseLayout with nav and analytics
│   │       ├── lib/        # Sanity client
│   │       └── pages/      # Routes (/, /comic/[slug], /archive, /admin)
│   └── worker/         # Cloudflare Worker API (create/update comics)
├── packages/
│   └── shared/         # Shared TypeScript types
├── sanity/             # Schema reference docs
├── sanity-studio/      # Sanity Studio (content management UI)
├── test-assets/        # Sample images for testing
├── DEPLOY.md           # Production deployment guide
└── README.md
```

---

## Site Routes

| Route | Description |
|-------|-------------|
| `/` | Latest comic |
| `/comic/[slug]` | Single comic by slug |
| `/archive` | List of all comics |
| `/admin` | Admin panel (protect with Cloudflare Access in production) |
| `/api/comics` | Internal API to list comics (used by admin UI) |

---

## Admin Panel Features

Access at `/admin` (no link in public nav - admins should bookmark it):

- **📤 Upload New Comic** - Create a new comic with image upload
- **✏️ Modify Comic** - Edit existing comics (title, slug, image, alt text, transcript)
- **🤖 Modify Site with AI** - Coming soon
- **📊 View Analytics** - Links to Cloudflare Web Analytics (if configured)

---

## Creating Comics

### Option 1: Sanity Studio (Recommended for bulk work)
1. Run `npm run dev` in `sanity-studio/`
2. Open http://localhost:3333
3. Create a new Comic Episode with title, image, slug, etc.

### Option 2: Admin Panel (Quick uploads)
1. Go to http://localhost:4321/admin
2. Click "Upload New Comic"
3. Fill in the form and submit

### Option 3: API (Programmatic)
```bash
curl -X POST http://localhost:8787/api/comics \
  -F 'json={"title":"Episode 1","slug":"episode-1","altText":"First comic"}' \
  -F 'image=@path/to/comic.png'
```

---

## Analytics (Optional)

The template supports Cloudflare Web Analytics for tracking page views and popular comics.

### Setup
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Web Analytics
2. Click "Add a site" and enter your Pages URL (e.g., `my-webcomic.pages.dev`)
3. Copy the beacon token
4. Add to your environment:
   - Local: Add `CF_ANALYTICS_TOKEN=your_token` to `apps/site/.dev.vars`
   - Production: Add as environment variable in Cloudflare Pages dashboard

If not configured, analytics is simply disabled (no errors).

---

## Production Deployment

See [DEPLOY.md](./DEPLOY.md) for full deployment instructions including:
- Deploying the Worker API to Cloudflare Workers
- Deploying the Site to Cloudflare Pages
- Deploying Sanity Studio
- Setting up Cloudflare Access for admin protection
- Configuring analytics

---

## Environment Variables Reference

### Site (apps/site/.dev.vars for local, CF Pages dashboard for production)

| Variable | Required | Description |
|----------|----------|-------------|
| `SANITY_PROJECT_ID` | Yes | Your Sanity project ID |
| `SANITY_DATASET` | No | Dataset name (default: `production`) |
| `SANITY_API_VERSION` | No | API version (default: `2024-01-01`) |
| `PUBLIC_WORKER_URL` | No | Worker URL (default: `http://localhost:8787`) |
| `CF_ANALYTICS_TOKEN` | No | Cloudflare Web Analytics token |

### Worker (apps/worker/.dev.vars for local, wrangler secrets for production)

| Variable | Required | Description |
|----------|----------|-------------|
| `SANITY_PROJECT_ID` | Yes | Your Sanity project ID |
| `SANITY_DATASET` | Yes | Dataset name |
| `SANITY_WRITE_TOKEN` | Yes | Sanity API token with write access |
| `ADMIN_ORIGIN` | Yes | Allowed origin for CORS (your Pages URL) |

---

## API Endpoints

### POST /api/comics
Create a new comic. Multipart form with `json` (metadata) and `image` file.

### PATCH /api/comics/:id  
Update an existing comic. Multipart form with `json` and optional `image`.

### GET /health
Health check endpoint.

---

## Troubleshooting

### Build fails with "Missing SANITY_PROJECT_ID"
Make sure you've created `apps/site/.dev.vars` from the example file and filled in your project ID.

### 500 Error on Cloudflare Pages
The template uses `astro:env` for environment variables. Make sure all required env vars are set in the Cloudflare Pages dashboard under Settings → Environment variables.

### Comics not showing after upload
Sanity CDN has a short cache. Wait ~30 seconds or hard refresh.

### CORS errors on admin uploads
Make sure `ADMIN_ORIGIN` in worker secrets matches your Pages URL exactly (including `https://`).

### "Session" or KV binding errors
The template includes `session: { driver: 'memory' }` in astro.config.mjs to avoid KV binding requirements. This is already configured.

---

## License

MIT
