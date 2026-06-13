// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import starlightThemeNova from 'starlight-theme-nova'

// https://astro.build/config
export default defineConfig({
	site: 'https://bananapb.github.io',
	base: '/baroudeur-culinaire',
	integrations: [
		sitemap({
		// configuration options
		}),
		starlight({
			plugins: [starlightThemeNova()],
			title: 'Baroudeur Culinaire',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/BananaPB/baroudeur-culinaire' },
				{ icon: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/baroudeurculinaire/' }
			],
			sidebar: [
				{
					label: 'Composants',
					items: [{ autogenerate: { directory: 'composants' } }],
				},
				{
					label: 'Méthodes',
					items: [{ autogenerate: { directory: 'methodes' } }],
				},
				{
					label: 'Recherches',
					items: [{ autogenerate: { directory: 'recherches' } }],
				},
			],
		}),
	],
});
