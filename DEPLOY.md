# Production Deployment Guide

This guide walks through deploying your webcomic site to Cloudflare.

## Prerequisites

- Cloudflare account (free tier works)
- Sanity project created (see Setup section in README)
- Node.js 18+ and pnpm installed

---

## Step 1: Authenticate Wrangler

```bash
cd apps/worker
pnpm add -D wrangler
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

For `ADMIN_ORIGIN`, use your production site URL (e.g., `https://your-site.pages.dev`).
You can update this later once you know the Pages URL.

### 2b. Deploy

```bash
pnpm wrangler deploy
```

Note the worker URL (e.g., `https://your-worker.workers.dev`).

---

## Step 3: Deploy the Site (Cloudflare Pages)

### 3a. Build the site

```bash
cd apps/site
pnpm add -D wrangler
pnpm build
```

### 3b. Deploy via Wrangler (Recommended)

```bash
pnpm wrangler pages deploy ./dist --project-name your-webcomic-site
```

First deploy will create the project. Note the URL.

### 3c. Set Environment Variables

In Cloudflare Dashboard → Pages → your project → Settings → Environment variables:

| Variable | Value |
|----------|-------|
| `SANITY_PROJECT_ID` | Your Sanity project ID |
| `SANITY_DATASET` | `production` |
| `SANITY_API_VERSION` | `2024-01-01` |

---

## Step 4: Update ADMIN_ORIGIN

Once you have both URLs, update the worker's `ADMIN_ORIGIN`:

```bash
cd apps/worker
pnpm wrangler secret put ADMIN_ORIGIN
# Enter: https://your-site.pages.dev
```

---

## Step 5: Deploy Sanity Studio

```bash
cd sanity-studio
npm install
npm run deploy
```

Pick a hostname (e.g., `your-webcomic`) to get `https://your-webcomic.sanity.studio`.

---

## Step 6: Protect Admin Route (Optional)

Use Cloudflare Access to protect `/admin`:

1. Cloudflare Dashboard → Zero Trust → Access → Applications
2. Add application → Self-hosted
3. Domain: `your-site.pages.dev`, Path: `/admin`
4. Add policy to allow your email
5. Enable "One-time PIN" for easy email-based login

---

## Step 7: Verify Deployment

1. Visit your Pages URL
2. Check that comics display (or "No comics yet" message)
3. Go to your Sanity Studio and create a comic
4. Refresh the site - comic should appear

---

## Troubleshooting

### 500 Error on Pages
The Astro Cloudflare adapter requires `session: { driver: 'memory' }` in astro.config.mjs to avoid KV binding issues. This is already configured in the template.

### CORS errors on admin
Make sure `ADMIN_ORIGIN` secret matches exactly your Pages URL (including `https://`).

### Comics not loading
Check that `SANITY_PROJECT_ID` and `SANITY_DATASET` are set correctly in Pages environment variables.

---

## Production URLs Checklist

After deployment, fill in your URLs:

| Service | URL |
|---------|-----|
| Site | `https://________________.pages.dev` |
| Worker API | `https://________________.workers.dev` |
| Sanity Studio | `https://________________.sanity.studio` |
