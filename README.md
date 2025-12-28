# Webcomic Blueprint

A monorepo template for building webcomic websites with:
- **Astro** - Static site generation with SSR support
- **Cloudflare Pages** - Hosting for the public site
- **Cloudflare Workers** - API for admin operations
- **Sanity** - Headless CMS for comic storage and asset management

## Repository Structure

```
webcomic-blueprint/
├── apps/
│   ├── site/          # Astro site (public + admin UI)
│   └── worker/        # Cloudflare Worker API
├── packages/
│   └── shared/        # Shared TypeScript types
├── sanity/            # Sanity schema definitions
├── test-assets/       # Sample images for testing
└── README.md
```

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- A Sanity account ([sanity.io](https://sanity.io))
- A Cloudflare account (for deployment)

## Environment Variables

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

## Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd webcomic-blueprint
pnpm install
```

### 2. Set Up Sanity

1. Go to [sanity.io/manage](https://sanity.io/manage)
2. Create a new project
3. Note your **Project ID**
4. Create an API token with **Editor** permissions
5. See [sanity/README.md](sanity/README.md) for schema setup

### 3. Configure Environment

```bash
# Site env
cp apps/site/.env.example apps/site/.env
# Edit with your Sanity project ID

# Worker env
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
# Edit with your Sanity credentials
```

### 4. Build Shared Package

```bash
pnpm --filter @webcomic/shared build
```

## Local Development

Run both the site and worker concurrently:

```bash
pnpm dev
```

This starts:
- Astro dev server at `http://localhost:4321`
- Worker dev server at `http://localhost:8787`

## API Endpoints

### POST /api/comics

Create a new comic episode.

**Request:** `multipart/form-data`
- `json` - JSON string with comic metadata
- `image` - Image file (png/jpg/webp/gif/avif, max 40MB)

**Example with curl:**

```bash
curl -X POST http://localhost:8787/api/comics \
  -F 'json={"title":"Episode 1","slug":"episode-1","altText":"First comic"}' \
  -F 'image=@test-assets/sample-comic.png'
```

**Response:**
```json
{
  "success": true,
  "data": { "_id": "abc123..." }
}
```

### PATCH /api/comics/:id

Update an existing comic episode.

**Request:** `application/json` or `multipart/form-data`

**Example with curl (JSON only):**

```bash
curl -X PATCH http://localhost:8787/api/comics/abc123 \
  -H 'Content-Type: application/json' \
  -d '{"title":"Updated Title"}'
```

**Example with curl (with new image):**

```bash
curl -X PATCH http://localhost:8787/api/comics/abc123 \
  -F 'json={"title":"Updated Title"}' \
  -F 'image=@new-image.png'
```

### GET /health

Health check endpoint.

```bash
curl http://localhost:8787/health
```

## Site Routes

| Route | Description |
|-------|-------------|
| `/` | Latest comic |
| `/comic/[slug]` | Single comic by slug |
| `/archive` | List of all comics |
| `/admin` | Admin panel (protected in production) |

## Deployment

### Deploy Site to Cloudflare Pages

```bash
cd apps/site
pnpm build
# Deploy dist/ to Cloudflare Pages
```

### Deploy Worker

```bash
cd apps/worker
# Set production secrets
wrangler secret put SANITY_PROJECT_ID
wrangler secret put SANITY_DATASET
wrangler secret put SANITY_WRITE_TOKEN
wrangler secret put ADMIN_ORIGIN

# Deploy
pnpm deploy
```

## Smoke Test

After setting up locally:

1. Start dev servers: `pnpm dev`
2. Create a comic:
   ```bash
   curl -X POST http://localhost:8787/api/comics \
     -F 'json={"title":"Test Comic","slug":"test-comic","altText":"A test"}' \
     -F 'image=@test-assets/sample-comic.png'
   ```
3. Visit `http://localhost:4321` - should show the comic
4. Visit `http://localhost:4321/archive` - should list it
5. Visit `http://localhost:4321/comic/test-comic` - should show it

## Phase 2 (Coming Soon)

- Cloudflare Access for admin protection
- PR preview deployments
- AI-powered site modifications
- Provisioning automation

## License

MIT
