import type { IconMap, SocialLink, Site, NavLink } from '@/types'

export const SITE: Site = {
  title: 'Baroudeur Culinaire',
  description:
    'blog personnel qui traite de vagabondage culinaire, pâtisserie végétale et autres élucubrations.',
  href: 'https://baroudeur-culinaire.netlify.app/',
  author: 'Nicolas Abadie',
  locale: 'fr-FR',
  featuredPostCount: 2,
  postsPerPage: 3,
}

export const NAV_LINKS: NavLink[] = [
  {
    href: '/blog',
    label: 'Blog',
  },
  {
    href: '/theory',
    label: 'Théorie',
    items: [
      { label: 'Méthodes', href: '/methods' },
      { label: 'Composants', href: '/components' },
    ]
  },
  {
    href: '/recipes',
    label: 'Recettes',
    items: [
      { label: 'Bases', href: '/bases' },
      { label: 'Produits finis', href: '/products' },
    ]
  },
  {
    href: '/about',
    label: 'à propos',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    href: 'https://www.instagram.com/baroudeurculinaire/',
    label: 'Instagram',
  },
  {
    href: 'https://www.tiktok.com/@baroudeurculinaire',
    label: 'Tiktok',
  },
  {
    href: 'https://www.linkedin.com/in/nicolas-abadie-621520264/',
    label: 'LinkedIn',
  },
  {
    href: 'mailto:nicolasabadie.pro@pm.me',
    label: 'Email',
  },
  {
    href: '/rss.xml',
    label: 'RSS',
  },
]

export const ICON_MAP: IconMap = {
  Instagram: 'lucide:instagram',
  Tiktok: 'lucide:music-2',
  LinkedIn: 'lucide:linkedin',
  Email: 'lucide:mail',
  RSS: 'lucide:rss',
}
