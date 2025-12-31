import { createClient, type SanityClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { Comic, ComicWithImageUrl } from '@webcomic/shared';
import {
  SANITY_PROJECT_ID,
  SANITY_DATASET,
  SANITY_API_VERSION,
} from 'astro:env/server';

let client: SanityClient | null = null;

export function getSanityClient(): SanityClient {
  if (!client) {
    client = createClient({
      projectId: SANITY_PROJECT_ID,
      dataset: SANITY_DATASET,
      apiVersion: SANITY_API_VERSION,
      useCdn: true,
    });
  }
  return client;
}

const builder = imageUrlBuilder({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
});

export function urlFor(source: Comic['image']): string {
  return builder.image(source).url();
}

function addImageUrl(comic: Comic): ComicWithImageUrl {
  const { image, ...rest } = comic;
  return {
    ...rest,
    imageUrl: urlFor(image),
  };
}

// GROQ Queries
const comicFields = `
  _id,
  _type,
  title,
  slug,
  publishedAt,
  image,
  altText,
  transcript,
  hidden
`;

// Public queries filter out hidden comics
export async function getLatestComic(): Promise<ComicWithImageUrl | null> {
  const client = getSanityClient();
  const query = `*[_type == "comicEpisode" && hidden != true] | order(publishedAt desc)[0] {${comicFields}}`;
  const comic = await client.fetch<Comic | null>(query);
  return comic ? addImageUrl(comic) : null;
}

export async function getComicBySlug(
  slug: string
): Promise<ComicWithImageUrl | null> {
  const client = getSanityClient();
  const query = `*[_type == "comicEpisode" && slug.current == $slug && hidden != true][0] {${comicFields}}`;
  const comic = await client.fetch<Comic | null>(query, { slug });
  return comic ? addImageUrl(comic) : null;
}

export async function getArchive(
  limit = 50
): Promise<ComicWithImageUrl[]> {
  const client = getSanityClient();
  const query = `*[_type == "comicEpisode" && hidden != true] | order(publishedAt desc)[0..${limit - 1}] {${comicFields}}`;
  const comics = await client.fetch<Comic[]>(query);
  return comics.map(addImageUrl);
}

// Admin queries - include hidden comics
export async function getAllComicsAdmin(
  limit = 100
): Promise<ComicWithImageUrl[]> {
  const client = getSanityClient();
  const query = `*[_type == "comicEpisode"] | order(publishedAt desc)[0..${limit - 1}] {${comicFields}}`;
  const comics = await client.fetch<Comic[]>(query);
  return comics.map(addImageUrl);
}

export async function getHiddenComics(
  limit = 100
): Promise<ComicWithImageUrl[]> {
  const client = getSanityClient();
  const query = `*[_type == "comicEpisode" && hidden == true] | order(publishedAt desc)[0..${limit - 1}] {${comicFields}}`;
  const comics = await client.fetch<Comic[]>(query);
  return comics.map(addImageUrl);
}

// Navigation queries - get prev/next comics by publishedAt date
export async function getAdjacentComics(
  publishedAt: string
): Promise<{ prev: ComicWithImageUrl | null; next: ComicWithImageUrl | null }> {
  const client = getSanityClient();
  
  // Previous comic: older than current (earlier publishedAt), get the most recent one
  const prevQuery = `*[_type == "comicEpisode" && hidden != true && publishedAt < $publishedAt] | order(publishedAt desc)[0] { _id, title, slug }`;
  
  // Next comic: newer than current (later publishedAt), get the oldest one  
  const nextQuery = `*[_type == "comicEpisode" && hidden != true && publishedAt > $publishedAt] | order(publishedAt asc)[0] { _id, title, slug }`;
  
  const [prev, next] = await Promise.all([
    client.fetch<Pick<Comic, '_id' | 'title' | 'slug'> | null>(prevQuery, { publishedAt }),
    client.fetch<Pick<Comic, '_id' | 'title' | 'slug'> | null>(nextQuery, { publishedAt }),
  ]);
  
  return {
    prev: prev ? { ...prev, imageUrl: '' } as ComicWithImageUrl : null,
    next: next ? { ...next, imageUrl: '' } as ComicWithImageUrl : null,
  };
}

