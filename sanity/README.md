# Sanity Schema for Webcomic Blueprint

This directory contains the Sanity schema definition for comic episodes.

## Schema: comicEpisode

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Comic episode title |
| slug | slug | Yes | URL-friendly identifier |
| publishedAt | datetime | Yes | Publication date |
| image | image | Yes | Comic image asset |
| altText | string | No | Accessibility description |
| transcript | text | No | Comic transcript for accessibility |

## Setup Instructions

### 1. Create a Sanity Project

Go to [sanity.io/manage](https://sanity.io/manage) and create a new project:

1. Click "Create new project"
2. Name it (e.g., "My Webcomic")
3. Choose "Create empty project with CLI" or any starter
4. Note down your **Project ID** (looks like `abc123xy`)

### 2. Create a Dataset

By default, a `production` dataset is created. You can use that or create a new one.

### 3. Create an API Token

1. In your project settings, go to "API"
2. Under "Tokens", click "Add API token"
3. Name it (e.g., "Webcomic Worker")
4. Choose **Editor** permissions (needs write access)
5. Copy the token immediately (you won't see it again)

### 4. Add Schema to Sanity Studio

If you have a Sanity Studio, copy the schema from `schema.ts` into your studio's schemas folder.

For a minimal setup without Studio, you can create documents directly via the API (which our Worker does).

## GROQ Queries Used

```groq
// Latest comic
*[_type == "comicEpisode"] | order(publishedAt desc)[0]

// Comic by slug
*[_type == "comicEpisode" && slug.current == $slug][0]

// Archive (up to 50)
*[_type == "comicEpisode"] | order(publishedAt desc)[0..49]
```
