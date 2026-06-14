import type { Loader } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  Recipe,
  type Step,
  type Ingredient,
  type FixedValue,
  type Range,
  type TextValue,
  type DecimalValue,
  type FractionValue,
} from '@tmlmt/cooklang-parser';

const CATEGORIES = ['desserts', 'entrees', 'plats'] as const;

export function combinedDocsLoader(): Loader {
  return {
    name: 'combined-docs-loader',
    load: async (context) => {
      await docsLoader().load(context);

      const recipesDir = fileURLToPath(new URL('../recipes/', import.meta.url));

      for (const category of CATEGORIES) {
        let files: string[];
        try {
          files = await readdir(`${recipesDir}${category}/`);
        } catch {
          continue;
        }

        for (const file of files.filter(f => f.endsWith('.cook'))) {
          const slug = file.replace(/\.cook$/, '');
          const id = `recipes/${category}/${slug}`;
          const raw = await readFile(`${recipesDir}${category}/${file}`, 'utf-8');
          const recipe = new Recipe(raw);

          const data = await context.parseData({
            id,
            data: {
              title: recipe.metadata.title ?? slug,
              description: recipe.metadata.description,
            },
          });

          context.store.set({
            id,
            data,
            filePath: `src/content/docs/recipes/${category}/${file}`,
            digest: context.generateDigest(raw),
            rendered: { html: renderRecipe(recipe) },
          });
        }
      }
    },
  };
}

function formatFixedValue(v: TextValue | DecimalValue | FractionValue): string {
  switch (v.type) {
    case 'text':     return v.value;
    case 'decimal':  return String(v.value);
    case 'fraction': return `${v.num}/${v.den}`;
  }
}

function formatQuantity(q: FixedValue | Range): string {
  if (q.type === 'fixed') return formatFixedValue(q.value);
  return `${formatFixedValue(q.min)}–${formatFixedValue(q.max)}`;
}

function ingredientQty(ing: Ingredient): string {
  if (!ing.quantity) return '';
  const amount = formatQuantity(ing.quantity);
  return ing.unit ? `${amount} ${ing.unit}` : amount;
}

function renderRecipe(recipe: Recipe): string {
  const parts: string[] = [];

  if (recipe.ingredients.length > 0) {
    parts.push('<h2>Ingrédients</h2><ul>');
    for (const ing of recipe.ingredients) {
      const qty = ingredientQty(ing);
      parts.push(`<li>${qty ? `<strong>${qty}</strong> ` : ''}${ing.name}</li>`);
    }
    parts.push('</ul>');
  }

  const hasSteps = recipe.sections.some(s => s.content.some(c => c.type === 'step'));
  if (!hasSteps) return parts.join('\n');

  parts.push('<h2>Préparation</h2>');

  for (const section of recipe.sections) {
    if (section.name) parts.push(`<h3>${section.name}</h3>`);

    const steps = section.content.filter((c): c is Step => c.type === 'step');
    if (steps.length === 0) continue;

    parts.push('<ol>');
    for (const step of steps) {
      const text = step.items.map(item => {
        switch (item.type) {
          case 'text':
            return item.value;
          case 'ingredient': {
            const ing = recipe.ingredients[item.index];
            return `<strong>${item.displayName ?? ing.name}</strong>`;
          }
          case 'cookware': {
            const cw = recipe.cookware[item.index];
            return `<em>${cw.name}</em>`;
          }
          case 'timer': {
            const t = recipe.timers[item.index];
            return `<em>${formatQuantity(t.duration)} ${t.unit}</em>`;
          }
        }
      }).join('');
      parts.push(`<li>${text}</li>`);
    }
    parts.push('</ol>');
  }

  return parts.join('\n');
}
