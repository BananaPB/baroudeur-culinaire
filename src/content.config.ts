import { defineCollection } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';
import { combinedDocsLoader } from './loaders/docs';

export const collections = {
  docs: defineCollection({
    loader: combinedDocsLoader(),
    schema: docsSchema(),
  }),
};