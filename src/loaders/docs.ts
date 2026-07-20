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

type RecipeIndex = Map<string, { url: string; numericYield: number | null }>;

export function combinedDocsLoader(): Loader {
  return {
    name: 'combined-docs-loader',
    load: async (context) => {
      await docsLoader().load(context);

      const recipesDir = fileURLToPath(new URL('../recipes/', import.meta.url));
      const base = import.meta.env.BASE_URL;

      // ── Pass 1: recursively find and parse every .cook file ──────────────
      type RecipeEntry = { relativePath: string; file: string; slug: string; id: string; raw: string; recipe: Recipe };
      const allRecipes: RecipeEntry[] = [];

      const allFiles = await readdir(recipesDir, { recursive: true });
      for (const entry of allFiles) {
        const file = (entry as string).replace(/\\/g, '/');
        if (!file.endsWith('.cook')) continue;
        const relativePath = file.replace(/\.cook$/, '');
        const slug = relativePath.split('/').at(-1)!;
        const raw = await readFile(`${recipesDir}${file}`, 'utf-8');
        allRecipes.push({ relativePath, file, slug, id: `recipes/${relativePath}`, raw, recipe: new Recipe(raw) });
      }

      // ── Build recipe index: "relative/path" → URL + numeric yield ────────
      const recipeIndex: RecipeIndex = new Map();
      for (const { relativePath, recipe } of allRecipes) {
        const yieldRaw = recipe.metadata['yield'];
        const numericYield = yieldRaw ? parseFloat(yieldRaw as string) : null;
        const url = `${base}recipes/${relativePath}/`;
        recipeIndex.set(relativePath.toLowerCase(), { url, numericYield });
      }

      // ── Pass 2: store each recipe with full index ─────────────────────────
      for (const { relativePath, file, slug, id, raw, recipe } of allRecipes) {
        const data = await context.parseData({
          id,
          data: {
            title: recipe.metadata.title ?? slug,
            description: recipe.metadata.description,
            draft: isDraft(raw),
            prev: false,
            next: false,
            recipeIngredients: renderIngredients(recipe, recipeIndex),
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
          filePath: `src/content/docs/recipes/${file}`,
          digest: context.generateDigest(raw),
          rendered: { html: '' },
        });
      }
    },
  };
}

// ─── Metadata helpers ──────────────────────────────────────────────────────────

/**
 * Cooklang's Metadata type doesn't recognize `draft`, so the parser silently
 * drops it. Read it straight from the frontmatter block instead: a bare
 * `draft` line or `draft: true` marks the recipe as a draft.
 */
function isDraft(raw: string): boolean {
  const frontmatter = raw.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
  return /^draft(\s*:\s*true)?\s*$/im.test(frontmatter);
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

function renderIngredients(recipe: Recipe, recipeIndex: RecipeIndex): string {
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

    let nameHtml = ing.name;
    if (ing.flags?.includes('recipe') && ing.extras?.path) {
      const rawPath = ing.extras.path.replace(/\.cook$/, '').replace(/\\/g, '/');
      const recipesMarker = rawPath.indexOf('src/recipes/');
      const key = (recipesMarker !== -1
        ? rawPath.slice(recipesMarker + 'src/recipes/'.length)
        : rawPath.replace(/^\.\//, '')
      ).toLowerCase();
      const linked = key ? recipeIndex.get(key) : undefined;
      if (linked) {
        const scaleParam = numericQty !== null ? `?scale=${numericQty}` : '';
        nameHtml = `<a href="${linked.url}${scaleParam}" class="recipe-link">${ing.name}</a>`;
      }
    }

    parts.push(
      `<li class="ingredient">` +
      `<div class="ingredient-main">` +
      `<span class="ingredient-name">${nameHtml}</span>` +
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
