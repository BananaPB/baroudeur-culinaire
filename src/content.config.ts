import { defineCollection } from 'astro:content';
import { docsSchema } from '@astrojs/starlight/schema';
import { topicSchema } from 'starlight-sidebar-topics/schema';
import { z } from 'astro:content';
import { combinedDocsLoader } from './loaders/docs';

export const collections = {
  docs: defineCollection({
    loader: combinedDocsLoader(),
    schema: docsSchema({
      extend: topicSchema.and(z.object({
        recipeIngredients: z.string().optional(),
        recipeCookware: z.string().optional(),
        recipeSections: z.string().optional(),
        recipeServings: z.string().optional(),
        recipePreptime: z.string().optional(),
        recipeTags: z.string().optional(),
        recipeYield: z.string().optional(),
      })),
    }),
  }),
};