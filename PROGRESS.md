# Webcomic Sandbox - Progress & Goals

This document tracks the goals and progress for building a webcomic website using the webcomic-blueprint template.

## Project Overview

**Goal:** Build a complete webcomic website with:
- Public site for readers (Cloudflare Pages)
- Admin panel for creators (protected by Cloudflare Access)
- API for comic management (Cloudflare Workers)
- Sanity CMS for content storage

**Repos:**
- Blueprint (template): https://github.com/ericvanlare/webcomic-blueprint
- Sandbox (this repo): https://github.com/ericvanlare/webcomic-sandbox

---

## Phase 1: Foundation ✅ COMPLETE

### Goals
- [x] Monorepo structure with pnpm workspaces
- [x] Astro site with routes: `/`, `/comic/[slug]`, `/archive`, `/admin`
- [x] Cloudflare Worker API with `POST /api/comics` and `PATCH /api/comics/:id`
- [x] Sanity schema for comic episodes
- [x] Shared TypeScript types
- [x] Local dev experience (`pnpm dev` runs both site + worker)
- [x] Image upload validation (40MB max, png/jpg/webp/gif/avif)

### Smoke Test Results
- [x] Created test comic via API ✅
- [x] Comic appears on homepage ✅
- [x] Comic appears in archive ✅
- [x] Direct slug link works ✅

### Environment Setup (Manual Steps Completed)
1. Created Sanity project at sanity.io/manage
2. Created API token with Editor permissions
3. Configured `apps/site/.env` with project ID
4. Configured `apps/worker/.dev.vars` with write token

---

## Phase 2: Production Deployment ✅ COMPLETE

### Goals
- [x] Build site for production
- [x] Create DEPLOY.md with full instructions
- [x] Update admin UI to support PUBLIC_WORKER_URL env var
- [x] Authenticate wrangler CLI
- [x] Deploy worker to Cloudflare Workers
- [x] Deploy site to Cloudflare Pages
- [x] Set production secrets
- [ ] Configure custom domain (optional)
- [ ] Set up Cloudflare Access for `/admin` protection (Google login)

### Deployment URLs
- **Site:** https://webcomic-sandbox.pages.dev
- **Worker:** (deployed separately)

### Key Fix: Session Driver
The `@astrojs/cloudflare` adapter v12 auto-enables Cloudflare KV sessions by default,
which requires a KV namespace binding. To avoid this complexity, we set:
```js
session: { driver: 'memory' }
```
in `astro.config.mjs`. This bypasses the KV requirement.

### Deployment Guide
See [DEPLOY.md](./DEPLOY.md) for step-by-step instructions.

### Environment Variables Reference

**Worker secrets (set via `wrangler secret put`):**
- `SANITY_PROJECT_ID`
- `SANITY_DATASET`
- `SANITY_WRITE_TOKEN`
- `ADMIN_ORIGIN` (your Pages URL)

**Pages environment variables (set in Cloudflare dashboard):**
- `SANITY_PROJECT_ID`
- `SANITY_DATASET`
- `SANITY_API_VERSION`
- `PUBLIC_WORKER_URL` (your Worker URL)

---

## Phase 3: Enhanced Admin (IN PROGRESS)

### Goals
- [x] Functional "Upload New Comic" form in admin UI (posts to Worker API, verified working)
- [x] "Modify Comic" UI - dropdown to select comic, edit form with pre-filled data, PATCH to update
- [ ] "Modify Site with AI" - agent-driven site modifications
- [ ] PR preview integration for proposed changes

---

## Phase 4: Advanced Features (TODO)

### Goals
- [ ] Comic navigation (prev/next links)
- [ ] RSS feed
- [ ] Social meta tags (Open Graph, Twitter cards)
- [ ] Search functionality
- [ ] Scheduled publishing
- [ ] Multiple comic series support

---

## Tech Stack Reference

| Component | Technology |
|-----------|------------|
| Site Framework | Astro 5.x with SSR |
| Hosting | Cloudflare Pages |
| API | Cloudflare Workers |
| CMS | Sanity.io |
| Auth (planned) | Cloudflare Access |
| Package Manager | pnpm 9.x |
| Language | TypeScript |

---

## Local Development

```bash
# Install dependencies
pnpm install

# Build shared types (required first time)
pnpm --filter @webcomic/shared build

# Run dev servers (site:4321, worker:8787)
pnpm dev

# Create a test comic
curl -X POST http://localhost:8787/api/comics \
  -F 'json={"title":"My Comic","slug":"my-comic","altText":"Description"}' \
  -F "image=@$HOME/Workspace/webcomic-sandbox/test-assets/sample-comic.png"
```

---

## File Structure

```
webcomic-sandbox/
├── apps/
│   ├── site/                 # Astro site
│   │   ├── src/
│   │   │   ├── pages/        # Routes
│   │   │   ├── layouts/      # BaseLayout.astro
│   │   │   └── lib/          # sanity.ts client
│   │   └── .env              # SANITY_PROJECT_ID, etc.
│   └── worker/               # Cloudflare Worker
│       ├── src/index.ts      # API endpoints
│       └── .dev.vars         # SANITY_WRITE_TOKEN, etc.
├── packages/shared/          # TypeScript types
├── sanity/                   # Schema definitions
├── test-assets/              # Sample images
├── PROGRESS.md               # This file
└── README.md                 # Setup instructions
```

---

## Notes for Next Agent

1. **Sanity is configured** - project ID and token are in env files (not committed)
2. **Site runs on port 4321**, worker on **port 8787**
3. **Admin UI at `/admin`** has upload form that POSTs to worker API
4. **Blueprint repo** is the template; **sandbox repo** is the working instance
5. If you see `svgo` errors, ensure Astro is pinned to `^5.0.0` not latest
6. **Session driver fix:** Must use `session: { driver: 'memory' }` in astro.config.mjs to avoid Cloudflare KV binding requirement
7. **Deploy via wrangler:** Use `pnpm wrangler pages deploy ./dist --project-name <name>` from apps/site for reliable deployments
