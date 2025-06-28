import { getCollection } from 'astro:content'

export async function getAllPosts() {
  const collections = ['blog', 'recipes', 'theory'] as const
  const postsArrays = await Promise.all(
    collections.map(collection => getCollection(collection))
  )
  return postsArrays.flat()
} 