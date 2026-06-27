import type { Loader } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import {
  Recipe,
  type Ingredient,
  type FixedValue,
  type Range,
  type TextValue,
  type DecimalValue,
  type FractionValue,
} from '@tmlmt/cooklang-parser';
import type { SerializedSection, SerializedItem } from '../types/recipe';

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
              prev: false,
              next: false,
              recipeIngredients: renderIngredients(recipe),
              recipeCookware: renderCookware(recipe),
              recipeSections: JSON.stringify(serializeRecipe(recipe)),
              recipeServings: recipe.metadata.servings as string | undefined,
              recipePreptime: recipe.metadata['prep time'] as string | undefined,
              recipeTags: Array.isArray(recipe.metadata.tags)
                ? (recipe.metadata.tags as string[]).join(', ')
                : recipe.metadata.tags as string | undefined,
              recipeYield: recipe.metadata['yield'] as string | undefined,
            },
          });

          context.store.set({
            id,
            data,
            filePath: `src/content/docs/recipes/${category}/${file}`,
            digest: context.generateDigest(raw),
            rendered: { html: '' },
          });
        }
      }
    },
  };
}

// ─── Quantity helpers ─────────────────────────────────────────────────────────

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
  return ing.unit ? `${amount} ${ing.unit}` : amount;
}

function getNumericQty(ing: Ingredient): number | null {
  if (!ing.quantity || ing.quantity.type !== 'fixed') return null;
  const val = ing.quantity.value;
  if (val.type === 'decimal') return val.value;
  if (val.type === 'fraction') return val.num / val.den;
  return null;
}

// ─── Sidebar HTML renderers ───────────────────────────────────────────────────

function renderIngredients(recipe: Recipe): string {
  if (recipe.ingredients.length === 0) return '';
  const parts = ['<ul>'];
  for (const ing of recipe.ingredients) {
    const qty = ingredientQty(ing);
    const numericQty = getNumericQty(ing);
    const qtyAttr = numericQty !== null
      ? ` data-original="${numericQty}" data-unit="${ing.unit ?? ''}"`
      : '';
    const prep = ing.preparation
      ? `<small class="ingredient-prep">(${ing.preparation})</small>`
      : '';
    parts.push(
      `<li class="ingredient">` +
      `<div class="ingredient-main">` +
      `<span class="ingredient-name">${ing.name}</span>` +
      `<span class="ingredient-qty"${qtyAttr}>${qty}</span>` +
      `</div>` +
      prep +
      `</li>`
    );
  }
  parts.push('</ul>');
  return parts.join('\n');
}

function renderCookware(recipe: Recipe): string {
  if (recipe.cookware.length === 0) return '';
  const parts = ['<ul>'];
  for (const cw of recipe.cookware) {
    const qty = cw.quantity ? formatQuantity(cw.quantity) : '';
    parts.push(`<li>${qty ? `<strong>${qty}</strong> ` : ''}${cw.name}</li>`);
  }
  parts.push('</ul>');
  return parts.join('\n');
}

// ─── Recipe serializer (for Astro template) ───────────────────────────────────

function serializeRecipe(recipe: Recipe): SerializedSection[] {
  return recipe.sections.map((section) => ({
    name: section.name,
    content: section.content.map((c): SerializedSection['content'][number] => {
      if (c.type === 'note') {
        return { type: 'note', note: c.note };
      }
      return {
        type: 'step',
        items: c.items.map((item): SerializedItem => {
          switch (item.type) {
            case 'text':
              return { type: 'text', value: item.value };
            case 'ingredient': {
              const ing = recipe.ingredients[item.index];
              return { type: 'ingredient', name: item.displayName ?? ing.name };
            }
            case 'cookware': {
              const cw = recipe.cookware[item.index];
              return { type: 'cookware', name: cw.name };
            }
            case 'timer': {
              const t = recipe.timers[item.index];
              return { type: 'timer', duration: formatQuantity(t.duration), unit: t.unit };
            }
          }
        }),
      };
    }),
  }));
}
