// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import starlightThemeNova from 'starlight-theme-nova'
import starlightSidebarTopics from 'starlight-sidebar-topics'

// https://astro.build/config
export default defineConfig({
	site: 'https://bananapb.github.io',
	base: '/baroudeur-culinaire',
	integrations: [
		sitemap({
		// configuration options
		}),
		starlight({
			customCss: ['./src/styles/recipe.css', './src/styles/theme.css'],
			plugins: [
				starlightSidebarTopics([
					{
						id: 'wiki',
						label: 'Wiki',
						link: '/wiki/getting-started/',
						icon: 'open-book',
						items: [
							{ label: 'Start Here', items: ['wiki/getting-started'] },
							{ label: 'Composants', items: [{ autogenerate: { directory: 'wiki/composants' } }] },
							{ label: 'Méthodes', items: [{ autogenerate: { directory: 'wiki/methodes' } }] },
							{ label: 'Recherches', items: [{ autogenerate: { directory: 'wiki/recherches' } }] },
						],
					},
					{
						id: 'recettes',
						label: 'Recettes',
						link: '/recipes/',
						icon: 'puzzle',
						items: [
							{ label: 'Desserts', items: [{ autogenerate: { directory: 'recipes/desserts' } }] },
							{ label: 'Entrées', items: [{ autogenerate: { directory: 'recipes/entrees' } }] },
							{ label: 'Plats', items: [{ autogenerate: { directory: 'recipes/plats' } }] },
						],
					}
				], { topics: { wiki: ['/'] } })
			],
			components: {
				TableOfContents: './src/components/PageSidebar.astro',
				MarkdownContent: './src/components/MarkdownContent.astro',
				PageTitle: './src/components/RecipePageTitle.astro',
			},
			title: 'Baroudeur Culinaire',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/BananaPB/baroudeur-culinaire' },
				{ icon: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/baroudeurculinaire/' }
			]
		}),
	],
});
