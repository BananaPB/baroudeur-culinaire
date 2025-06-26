import { getCollection, type CollectionEntry } from 'astro:content'

export async function getAllSocials(): Promise<CollectionEntry<'socials'>[]> {
  const socials = await getCollection('socials')

  return socials.sort((a, b) => {
    const orderA = a.data.order || 0
    const orderB = b.data.order || 0
    return orderA - orderB
  })
}