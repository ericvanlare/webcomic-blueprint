/**
 * Sanity Schema Definition for Comic Episodes
 * 
 * To use this schema:
 * 1. Create a new Sanity project at https://sanity.io/manage
 * 2. Initialize Sanity Studio in your project (or use the hosted Studio)
 * 3. Add this schema to your Sanity Studio's schema.ts
 * 
 * If using Sanity Studio v3, add to your sanity.config.ts:
 * 
 * import { defineConfig } from 'sanity'
 * import { comicEpisode } from './schemas/comicEpisode'
 * 
 * export default defineConfig({
 *   // ...
 *   schema: {
 *     types: [comicEpisode],
 *   },
 * })
 */

import { defineType, defineField } from 'sanity';

export const comicEpisode = defineType({
  name: 'comicEpisode',
  title: 'Comic Episode',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'altText',
      title: 'Alt Text',
      type: 'string',
      description: 'Accessibility description of the image',
    }),
    defineField({
      name: 'transcript',
      title: 'Transcript',
      type: 'text',
      description: 'Text transcript of the comic for accessibility',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      date: 'publishedAt',
      media: 'image',
    },
    prepare({ title, date, media }) {
      return {
        title,
        subtitle: date ? new Date(date).toLocaleDateString() : 'No date',
        media,
      };
    },
  },
  orderings: [
    {
      title: 'Published Date, New',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
    {
      title: 'Published Date, Old',
      name: 'publishedAtAsc',
      by: [{ field: 'publishedAt', direction: 'asc' }],
    },
  ],
});
