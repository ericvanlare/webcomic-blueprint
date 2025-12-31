# Production Deployment Guide

This guide walks through deploying your webcomic site to Cloudflare.

## Prerequisites

- Cloudflare account (free tier works)
- Sanity project created (see README)
- Node.js 18+ and pnpm installed
- Local development working (`pnpm dev` runs successfully)

---

## Overview

You'll deploy three things:
1. **Worker API** - Handles comic uploads and modifications
2. **Site** - The public-facing Astro site on Cloudflare Pages
3. **Sanity Studio** - Content management UI (hosted by Sanity)

---

## Step 1: Authenticate Wrangler

```bash
cd apps/worker
pnpm wrangler login
```

Verify with:
```bash
pnpm wrangler whoami
```

---

## Step 2: Deploy the Worker (API)

### 2a. Set Production Secrets

```bash
cd apps/worker

# Set each secret (you'll be prompted for values)
pnpm wrangler secret put SANITY_PROJECT_ID
pnpm wrangler secret put SANITY_DATASET
pnpm wrangler secret put SANITY_WRITE_TOKEN
pnpm wrangler secret put ADMIN_ORIGIN
```

For `ADMIN_ORIGIN`, use a placeholder for now (e.g., `https://placeholder.pages.dev`).
You'll update this after deploying the site.

### 2b. Deploy

```bash
pnpm wrangler deploy
```

Note the worker URL (e.g., `https://webcomic-api.your-subdomain.workers.dev`).

---

## Step 3: Deploy the Site (Cloudflare Pages)

### 3a. Build the site locally first to verify

```bash
cd apps/site
pnpm build
```

### 3b. Create Pages project and deploy

```bash
pnpm wrangler pages deploy ./dist --project-name my-webcomic
```

First deploy will create the project. Note the URL (e.g., `https://my-webcomic.pages.dev`).

### 3c. Set Environment Variables

Go to Cloudflare Dashboard → Pages → your project → Settings → Environment variables.

Add these for **both Production and Preview**:

| Variable | Value | Required |
|----------|-------|----------|
| `SANITY_PROJECT_ID` | Your Sanity project ID | Yes |
| `SANITY_DATASET` | `production` | Yes |
| `SANITY_API_VERSION` | `2024-01-01` | Yes |
| `PUBLIC_WORKER_URL` | Your worker URL from Step 2b | Yes |
| `CF_ANALYTICS_TOKEN` | Your analytics token (see Step 6) | No |

### 3d. Trigger a new deployment

After setting env vars, trigger a new deployment:

```bash
pnpm wrangler pages deploy ./dist --project-name my-webcomic
```

---

## Step 4: Update ADMIN_ORIGIN

Now that you have the Pages URL, update the worker secret:

```bash
cd apps/worker
pnpm wrangler secret put ADMIN_ORIGIN
# Enter: https://my-webcomic.pages.dev
```

---

## Step 5: Deploy Sanity Studio

```bash
cd sanity-studio
npm install
npm run deploy
```

Pick a hostname (e.g., `my-webcomic`) to get `https://my-webcomic.sanity.studio`.

---

## Step 6: Set Up Analytics (Optional)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Web Analytics
2. Click "Add a site"
3. Enter your Pages URL (e.g., `my-webcomic.pages.dev`)
4. Copy the beacon token
5. Add `CF_ANALYTICS_TOKEN` to your Pages environment variables (Step 3c)
6. Redeploy the site

The "📊 View Analytics" button will appear in your admin panel.

---

## Step 7: Protect Admin Route (Recommended)

Use Cloudflare Access to protect `/admin`:

1. Go to Cloudflare Dashboard → Zero Trust → Access → Applications
2. Click "Add an application" → Self-hosted
3. Configure:
   - **Application name**: My Webcomic Admin
   - **Session duration**: 24 hours (or your preference)
   - **Application domain**: `my-webcomic.pages.dev`
   - **Path**: `/admin`
4. Create an access policy:
   - **Policy name**: Allow Me
   - **Action**: Allow
   - **Include**: Emails ending in `@yourdomain.com` (or specific email)
5. Enable "One-time PIN" for easy email-based login
6. Save

Now `/admin` requires authentication.

---

## Step 8: Verify Deployment

1. ✅ Visit your Pages URL - should show "No comics yet" or your comics
2. ✅ Go to `/admin` - should prompt for Access login (if configured)
3. ✅ Create a comic via admin panel or Sanity Studio
4. ✅ Refresh main site - comic should appear
5. ✅ Check analytics after a few page views (if configured)

---

## Continuous Deployment (Optional)

### Connect GitHub to Cloudflare Pages

1. Go to Cloudflare Dashboard → Pages → your project → Settings → Builds & deployments
2. Connect to your GitHub repository
3. Configure build settings:
   - **Build command**: `pnpm --filter site build`
   - **Build output directory**: `apps/site/dist`
   - **Root directory**: `/` (repo root)
4. Set environment variables in the Pages dashboard

Now pushes to `main` will auto-deploy!

### Worker Deployment

For the worker, you can set up GitHub Actions:

```yaml
# .github/workflows/deploy-worker.yml
name: Deploy Worker
on:
  push:
    branches: [main]
    paths: ['apps/worker/**', 'packages/shared/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - run: pnpm install
      - run: pnpm --filter @webcomic/shared build
      - run: pnpm --filter worker deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

---

## Production URLs Checklist

After deployment, record your URLs:

| Service | URL |
|---------|-----|
| Site | `https://________________.pages.dev` |
| Worker API | `https://________________.workers.dev` |
| Sanity Studio | `https://________________.sanity.studio` |

---

## Troubleshooting

### 500 errors after deploy
Check that all environment variables are set in Pages dashboard. The most common issue is missing `SANITY_PROJECT_ID`.

### Comics upload fails with CORS error
Make sure `ADMIN_ORIGIN` worker secret exactly matches your Pages URL (including `https://`).

### Analytics not showing
- Make sure `CF_ANALYTICS_TOKEN` is set in Pages env vars
- Redeploy after adding the token
- Analytics data takes a few minutes to appear

### Admin page shows "Loading comics..." forever
The `/api/comics` endpoint isn't working. Check that:
- Site is deployed with all env vars
- You can access `https://your-site.pages.dev/api/comics` directly

### Changes not appearing
Sanity CDN caches for ~30 seconds. Hard refresh or wait.
