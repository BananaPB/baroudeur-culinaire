export type Site = {
  title: string
  description: string
  href: string
  author: string
  locale: string
  featuredPostCount: number
  postsPerPage: number
}

export type SocialLink = {
  href: string
  label: string
}

export type NavLink = {
  href: string
  label: string
  items?: { label: string; href: string }[]
}

export type IconMap = {
  [key: string]: string
}
