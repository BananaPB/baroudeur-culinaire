import { glob } from 'astro/loaders'
import { defineCollection, z } from 'astro:content'

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      order: z.number().optional(),
      image: image().optional(),
      tags: z.array(z.string()).optional(),
      draft: z.boolean().optional(),
      banner_credits: z.string().optional()
    }),
})

const recipes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/recipes' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      image: image().optional(),
      ingredients: z.string(),
      tags: z.array(z.string()).optional(),
      draft: z.boolean().optional(),
      order: z.number().optional(),
      banner_credits: z.string().optional()
    }),
})

const theory = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/theory' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      date: z.coerce.date(),
      image: image().optional(),
      tags: z.array(z.string()).optional(),
      draft: z.boolean().optional(),
      order: z.number().optional(),
      banner_credits: z.string().optional()
    }),
})

export const collections = { blog, recipes, theory }
