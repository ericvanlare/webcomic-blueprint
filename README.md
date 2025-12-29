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
3. Create an API token with **Editor** permissions

### 3. Configure Sanity Studio

Edit these files with your Project ID:
- `sanity-studio/sanity.config.ts` - Replace `YOUR_PROJECT_ID`
- `sanity-studio/sanity.cli.ts` - Replace `YOUR_PROJECT_ID`

### 4. Configure Environment

```bash
# Site env
cp apps/site/.env.example apps/site/.env
# Edit apps/site/.env with your SANITY_PROJECT_ID

# Worker env (for local dev)
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
│   └── worker/         # Cloudflare Worker API
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

---

## Creating Comics

### Option 1: Sanity Studio (Recommended)
1. Run `npm run dev` in `sanity-studio/`
2. Open http://localhost:3333
3. Create a new Comic Episode with title, image, slug, etc.

### Option 2: API (Programmatic)
```bash
curl -X POST http://localhost:8787/api/comics \
  -F 'json={"title":"Episode 1","slug":"episode-1","altText":"First comic"}' \
  -F 'image=@path/to/comic.png'
```

---

## Production Deployment

See [DEPLOY.md](./DEPLOY.md) for full deployment instructions including:
- Deploying the Worker API to Cloudflare Workers
- Deploying the Site to Cloudflare Pages
- Deploying Sanity Studio
- Setting up Cloudflare Access for admin protection

---

## Environment Variables Reference

### Site (apps/site/.env)
```bash
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production
SANITY_API_VERSION=2024-01-01
```

### Worker (apps/worker/.dev.vars)
```bash
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production
SANITY_WRITE_TOKEN=your_write_token
ADMIN_ORIGIN=http://localhost:4321
```

---

## API Endpoints

### POST /api/comics
Create a new comic. Multipart form with `json` (metadata) and `image` file.

### PATCH /api/comics/:id  
Update an existing comic. JSON body or multipart with new image.

### GET /health
Health check endpoint.

---

## Troubleshooting

### 500 Error on Cloudflare Pages
The template includes `session: { driver: 'memory' }` in astro.config.mjs to avoid Cloudflare KV binding requirements.

### svgo/css-tree errors
Ensure Astro is pinned to `^5.0.0` not `latest` in apps/site/package.json.

### CORS errors on admin uploads
Ensure `ADMIN_ORIGIN` matches your Pages URL exactly (including `https://`).

---

## License

MIT
