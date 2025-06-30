import { getCollection, render, type CollectionEntry } from 'astro:content'
import type { TOCSection } from './utils'
import { calculateWordCountFromHtml, readingTime, } from './utils'
import slugify from 'slugify'

export const basePath = 'recipes'

export async function getAllPosts(): Promise<CollectionEntry<'recipes'>[]> {
  const posts = await getCollection('recipes')
  return posts
    .filter((post) => !post.data.draft && !isSubpost(post.id))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
}

export async function getAllPostsByCategory(category: string): Promise<CollectionEntry<'recipes'>[]> {
  const posts = await getCollection('recipes')
  return posts
    .filter((post) => post.id.startsWith(`${category}/`))
    .filter((post) => !post.data.draft && !isSubpost(post.id))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
}

export async function getPostById(
  postId: string,
): Promise<CollectionEntry<'recipes'> | null> {
  const allPosts = await getAllPostsAndSubposts()
  return allPosts.find((post) => post.id === postId) || null
}

export async function getPostsByTag(
  tag: string,
  category: string | null
): Promise<CollectionEntry<'recipes'>[]> {
  const posts = category === null ? await getAllPosts() : await getAllPostsByCategory(category)

  return posts.filter((post) => post.data.tags?.includes(tag))
}

export async function getAllPostsAndSubposts(): Promise<
  CollectionEntry<'recipes'>[]
> {
  const posts = await getCollection('recipes')
  return posts
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
}

export async function getAdjacentPosts(currentId: string): Promise<{
  newer: CollectionEntry<'recipes'> | null
  older: CollectionEntry<'recipes'> | null
  parent: CollectionEntry<'recipes'> | null
}> {
  const currentPath = currentId.split('/')
  const category = currentPath.length > 1 ? currentPath[0] : null
  const allPosts = category ? await getAllPostsByCategory(category) : await getAllPosts()

  if (isSubpost(currentId)) {
    const parentId = getParentId(currentId)
    const parent = allPosts.find((post) => post.id === parentId) || null

    const posts = await getCollection('recipes')
    const subposts = posts
      .filter(
        (post) =>
          isSubpost(post.id) &&
          getParentId(post.id) === parentId &&
          !post.data.draft,
      )
      .sort((a, b) => {
        const dateDiff = a.data.date.valueOf() - b.data.date.valueOf()
        if (dateDiff !== 0) return dateDiff

        const orderA = a.data.order ?? 0
        const orderB = b.data.order ?? 0
        return orderA - orderB
      })

    const currentIndex = subposts.findIndex((post) => post.id === currentId)
    if (currentIndex === -1) {
      return { newer: null, older: null, parent }
    }

    return {
      newer:
        currentIndex < subposts.length - 1 ? subposts[currentIndex + 1] : null,
      older: currentIndex > 0 ? subposts[currentIndex - 1] : null,
      parent,
    }
  }

  const parentPosts = allPosts.filter((post) => !isSubpost(post.id))
  const currentIndex = parentPosts.findIndex((post) => post.id === currentId)

  if (currentIndex === -1) {
    return { newer: null, older: null, parent: null }
  }

  return {
    newer: currentIndex > 0 ? parentPosts[currentIndex - 1] : null,
    older:
      currentIndex < parentPosts.length - 1
        ? parentPosts[currentIndex + 1]
        : null,
    parent: null,
  }
}

export async function getSubpostsForParent(
  parentId: string,
): Promise<CollectionEntry<'recipes'>[]> {
  const posts = await getCollection('recipes')

  return posts
    .filter(
      (post) =>
        !post.data.draft &&
        isSubpost(post.id) &&
        getParentId(post.id) === parentId,
    )
    .sort((a, b) => {
      const dateDiff = a.data.date.valueOf() - b.data.date.valueOf()
      if (dateDiff !== 0) return dateDiff

      const orderA = a.data.order ?? 0
      const orderB = b.data.order ?? 0
      return orderA - orderB
    })
}

export function groupPostsByYear(
  posts: CollectionEntry<'recipes'>[],
): Record<string, CollectionEntry<'recipes'>[]> {
  return posts.reduce(
    (acc: Record<string, CollectionEntry<'recipes'>[]>, post) => {
      const year = post.data.date.getFullYear().toString()
      ;(acc[year] ??= []).push(post)
      return acc
    },
    {},
  )
}

export async function getParentPost(
  subpostId: string,
): Promise<CollectionEntry<'recipes'> | null> {
  if (!isSubpost(subpostId)) {
    return null
  }

  const parentId = getParentId(subpostId)
  const allPosts = await getAllPosts()
  return allPosts.find((post) => post.id === parentId) || null
}

export async function getRecentPosts(
  count: number,
): Promise<CollectionEntry<'recipes'>[]> {
  const posts = await getAllPosts()
  return posts.slice(0, count)
}

export function isSubpost(postId: string): boolean {
  return postId.split('/').length > 2
}

export function getParentId(subpostId: string): string {
  const split = subpostId.split('/');
  split.pop()
  
  return split.join('/')
}

export function getPostCategory(subpostId: string): string {
  return subpostId.split('/')[0]
}

export async function hasSubposts(postId: string): Promise<boolean> {
  const subposts = await getSubpostsForParent(postId)
  return subposts.length > 0
}

export async function getSubpostCount(parentId: string): Promise<number> {
  const subposts = await getSubpostsForParent(parentId)
  return subposts.length
}

export async function getPostReadingTime(postId: string): Promise<string> {
  const post = await getPostById(postId)
  if (!post) return readingTime(0)

  const wordCount = calculateWordCountFromHtml(post.body)
  return readingTime(wordCount)
}

export async function getCombinedReadingTime(postId: string): Promise<string> {
  const post = await getPostById(postId)
  if (!post) return readingTime(0)

  let totalWords = calculateWordCountFromHtml(post.body)

  if (!isSubpost(postId)) {
    const subposts = await getSubpostsForParent(postId)
    for (const subpost of subposts) {
      totalWords += calculateWordCountFromHtml(subpost.body)
    }
  }

  return readingTime(totalWords)
}

export async function getTOCSections(postId: string): Promise<TOCSection[]> {
  const post = await getPostById(postId)
  if (!post) return []

  const parentId = isSubpost(postId) ? getParentId(postId) : postId
  const parentPost = isSubpost(postId) ? await getPostById(parentId) : post

  if (!parentPost) return []

  const sections: TOCSection[] = []

  const { headings: parentHeadings } = await render(parentPost)
  if (parentHeadings.length > 0) {
    sections.push({
      type: 'parent',
      title: 'Overview',
      headings: parentHeadings.map((heading) => ({
        slug: heading.slug,
        text: heading.text,
        depth: heading.depth,
      })),
    })
  }

  const subposts = await getSubpostsForParent(parentId)
  for (const subpost of subposts) {
    const { headings: subpostHeadings } = await render(subpost)

    if (subpostHeadings.length > 0) {
      sections.push({
        type: 'subpost',
        title: subpost.data.title,
        headings: subpostHeadings.map((heading, index) => ({
          slug: heading.slug,
          text: heading.text,
          depth: heading.depth,
          isSubpostTitle: index === 0,
        })),
        subpostId: subpost.id,
      })
    }
  }

  return sections
}

export async function getAllTags(category: string | null): Promise<Map<string, number>> {
  const posts = category === null ? await getAllPosts() : await getAllPostsByCategory(category)
  return posts.reduce((acc, post) => {
    post.data.tags?.forEach((tag) => {
      acc.set(tag, (acc.get(tag) || 0) + 1)
    })
    return acc
  }, new Map<string, number>())
}

export async function getSortedTags(): Promise<
  { tag: string; count: number }[]
> {
  const tagCounts = await getAllTags(null)
  return [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => {
      const countDiff = b.count - a.count
      return countDiff !== 0 ? countDiff : a.tag.localeCompare(b.tag)
    })
}

export async function getSortedTagsByCategory(category: string): Promise<
  { tag: string; count: number }[]
> {
  const tagCounts = await getAllTags(category)
  return [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => {
      const countDiff = b.count - a.count
      return countDiff !== 0 ? countDiff : a.tag.localeCompare(b.tag)
    })
}

export const ingredientsJSON = import.meta.glob(
  'src/content/recipes/**/ingredients.json',
  {as: 'json'}
)

export type Ingredient = {
  name: string 
  quantity: number & { __positive: true }
  unit: string
  notes?: string
  slug?: string
}

export type Group = {
  name: string 
  list: Ingredient[],
}

export type IngredientsList = {
  ingredients: Group[],
  total: number & { __positive: true }
}

export async function getIngredients(currentPostId: string): Promise<IngredientsList | null> {
    const matchPath = Object.keys(ingredientsJSON).find(path =>
      path.includes(`/recipes/${currentPostId}/ingredients.json`)
    );
    const ingredients = matchPath ? await ingredientsJSON[matchPath]() : null;

    (ingredients as any)?.ingredients?.forEach((group: Group) => {
      group.list.forEach((e: Ingredient) => {
        const slug = slugify(e.name)
        e.slug = slug
      })
    });
    
    return ingredients as IngredientsList | null
}

/**
 * Processes content replacements in a post's body
 * @param post - The post to process
 * @param replacements - Map of words to replace (key: original word, value: replacement)
 * @returns A new post object with replaced content
 */
export function processContentReplacements(
  post: CollectionEntry<'recipes'>,
  replacements: Map<string, string>
): CollectionEntry<'recipes'> {
  if (!post.body) {
    return post
  }

  let processedBody = post.body

  // Apply each replacement
  for (const [originalWord, replacement] of replacements) {
    // Use a case-insensitive regex to match the word with word boundaries
    const regex = new RegExp(`\\b${originalWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    processedBody = processedBody.replace(regex, replacement)
  }

  // Create a new post object with the processed body
  return {
    ...post,
    body: processedBody
  }
}