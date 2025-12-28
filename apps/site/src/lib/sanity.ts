import { createClient, type SanityClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { Comic, ComicWithImageUrl } from '@webcomic/shared';

let client: SanityClient | null = null;

export function getSanityClient(): SanityClient {
  if (!client) {
    client = createClient({
      projectId: import.meta.env.SANITY_PROJECT_ID,
      dataset: import.meta.env.SANITY_DATASET || 'production',
      apiVersion: import.meta.env.SANITY_API_VERSION || '2024-01-01',
      useCdn: true,
    });
  }
  return client;
}

const builder = imageUrlBuilder({
  projectId: import.meta.env.SANITY_PROJECT_ID || '',
  dataset: import.meta.env.SANITY_DATASET || 'production',
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
  transcript
`;

export async function getLatestComic(): Promise<ComicWithImageUrl | null> {
  const client = getSanityClient();
  const query = `*[_type == "comicEpisode"] | order(publishedAt desc)[0] {${comicFields}}`;
  const comic = await client.fetch<Comic | null>(query);
  return comic ? addImageUrl(comic) : null;
}

export async function getComicBySlug(
  slug: string
): Promise<ComicWithImageUrl | null> {
  const client = getSanityClient();
  const query = `*[_type == "comicEpisode" && slug.current == $slug][0] {${comicFields}}`;
  const comic = await client.fetch<Comic | null>(query, { slug });
  return comic ? addImageUrl(comic) : null;
}

export async function getArchive(
  limit = 50
): Promise<ComicWithImageUrl[]> {
  const client = getSanityClient();
  const query = `*[_type == "comicEpisode"] | order(publishedAt desc)[0..${limit - 1}] {${comicFields}}`;
  const comics = await client.fetch<Comic[]>(query);
  return comics.map(addImageUrl);
}
