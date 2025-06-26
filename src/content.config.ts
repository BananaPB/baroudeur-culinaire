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
    }),
})

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      description: z.string(),
      tags: z.array(z.string()),
      image: image(),
      link: z.string().url(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    }),
})

const socials = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/socials' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      description: z.string(),
      image: image(),
      link: z.string().url(),
      order: z.number(),
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
      tags: z.array(z.string()).optional(),
      draft: z.boolean().optional(),
      order: z.number().optional(),
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
    }),
})

export const collections = { blog, projects, socials, recipes, theory }
