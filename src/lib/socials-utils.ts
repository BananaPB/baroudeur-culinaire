import { getCollection, type CollectionEntry } from 'astro:content'

export async function getAllSocials(): Promise<CollectionEntry<'socials'>[]> {
  const socials = await getCollection('socials')

  return socials
}