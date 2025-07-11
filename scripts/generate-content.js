import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import slugify from 'slugify';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { stringify } from 'querystring';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dossiers source/destination
const SOURCE_DIR = path.resolve(__dirname, '../content-obsidian');
const DEST_DIR = path.resolve(__dirname, '../src/content');

const folderMap = {
  '2. Pratique': {
    _out: 'recipes',
    'Bases': 'bases',
    'Produits': 'products'
  },
  '1. Théorie': {
    _out: 'theory',
    'Méthodes': 'methods',
    'Composants': 'components'
  },
  '3. Recherches': {
    _out: 'blog'
  }
};

async function cleanDest() {
  await fs.emptyDir(DEST_DIR);
  console.log(`🧹 Cleaned ${DEST_DIR}`);
}

function getAssetRelativePathFromDest(destFile, assetFilename) {
  const depth = path.relative(DEST_DIR, path.dirname(destFile)).split(path.sep).length;
  const prefix = '../'.repeat(depth);
  return `${prefix}assets/${assetFilename}`;
}

export async function removeSection(markdown, sectionTitle) {
  const tree = unified().use(remarkParse).parse(markdown);

  const newChildren = [];
  let skipping = false;

  for (let i = 0; i < tree.children.length; i++) {
    const node = tree.children[i];

    if (node.type === 'heading' && node.depth === 1) {
      const title = node.children.map(n => n.value || '').join('').toLowerCase().trim();

      if (title === sectionTitle.toLowerCase()) {
        skipping = true;
        continue;
      }

      if (skipping) {
        // Reprise de la lecture : nouvelle section # => arrêter de skipper
        skipping = false;
      }
    }

    if (!skipping) {
      newChildren.push(node);
    }
  }

  tree.children = newChildren;

  const result = unified().use(remarkStringify).stringify(tree);
  return result;
}

function extractIngredientsSectionFromAst(tree) {
  let inIngredientsSection = false;
  let currentGroup = null;
  const groups = [];

  for (const node of tree.children) {
    // Find "# Ingrédients"
    if (node.type === 'heading' && node.depth === 1 && node.children[0]?.value?.trim() === 'Ingrédients') {
      inIngredientsSection = true;
      continue;
    }
    if (inIngredientsSection) {
      // New group: "## Group Name"
      if (node.type === 'heading' && node.depth === 2) {
        if (currentGroup) groups.push(currentGroup);
        currentGroup = { name: node.children[0]?.value?.trim(), list: [], total: null };
      }
      // Table under the group
      else if (node.type === 'table' && currentGroup) {
        // Skip the first row (header)
        node.children.slice(1).forEach(row => {
          const cells = row.children.map(cell => cell.children.map(c => c.value).join('')).map(s => s.trim());
          if (cells[0]?.toLowerCase() === 'total') {
            currentGroup.total = cells[1];
          } else if (cells[0] && cells[1] && cells[2]) {
            const ingredient = {
              name: cells[0],
              quantity: cells[1],
              unit: cells[2]
            };
            if (cells[3]) {
              ingredient.notes = cells[3];
            }
            currentGroup.list.push(ingredient);
          }
        });
      }
      // End of section if another H1 is found
      else if (node.type === 'heading' && node.depth === 1) {
        if (currentGroup) groups.push(currentGroup);
        break;
      }
    }
  }
  return groups;
}

async function processFile(filePath, baseCategory, subCategory = null) {
  const rawContent = await fs.readFile(filePath, 'utf-8');
  const { content, data } = matter(rawContent);
  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);
  const slug = slugify(baseName, { lower: true, strict: true });

  if (data.date instanceof Date) {
    data.date = data.date.toISOString().split('T')[0];
  }

  if (typeof data.draft === 'string') {
    data.draft = data.draft.toLowerCase() === 'true';
  }

  // Destination finale
  const destFolder = path.join(DEST_DIR, baseCategory, ...(subCategory ? [subCategory] : []));
  const articleFolder = path.join(destFolder, slug);
  const destFile = path.join(articleFolder, 'index.mdx');

  if (
    data?.ingredients &&
    data?.ingredients === "'./ingredients.json'"
  ) {
    const tree = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .parse(content);
    const groups = extractIngredientsSectionFromAst(tree);
    const parsed = {
      ingredients: groups,
      portion: data?.portion || 1000,
      portion_unit: data?.portion_unit || "g"
    };
    if (parsed) {
      const recipeSlug = slugify(baseName.replace(/\.md$/, ''));
      const outputJsonPath = path.join(articleFolder,'ingredients.json');

      await fs.ensureDir(path.dirname(outputJsonPath));
      await fs.writeJson(outputJsonPath, parsed, { spaces: 2 });
      console.log(`✔ Fichier ingredients.json généré pour : ${recipeSlug}`);
    } else {
      console.warn(`⚠ Pas de section # Ingrédients trouvée dans : ${relativePath}`);
    }
  }

  // Étape 1 – Remplacer les ![[fichier.jpg|600x200]] ou ![[fichier.jpg]] par <Image ... />
  let containsImage = false;
  let updatedContent = content.replace(
    /!\[\[([^\]|]+?\.(?:png|jpe?g|webp|gif|svg))(?:\|(\d+)x(\d+))?\]\]/gi,
    (_, filename, width, height) => {
      const relativePath = getAssetRelativePathFromDest(destFile, filename);
      containsImage = true;
      let props = `src="${relativePath}" alt="Image"`;
      if (width && height) {
        props += ` width={${width}} height={${height}}`;
      }
      return `<Image ${props} />`;
    }
  );

  // === Étape 2.1 — Convertir les highlights
  updatedContent = updatedContent.replace(/==(.+?)==/g, '<span class="highlighted">$1</span>');

  // === Étape 2.2 — Convertir les temps
  let containsTime = /\b\d{1,2}h\d{1,2}(?:min)?\b|\b\d{1,2}h\b|\b\d{1,3}min\b/.test(updatedContent);
  updatedContent = updatedContent.replace(/(\b\d{1,2}h\d{1,2}(?:min)?\b|\b\d{1,2}h\b|\b\d{1,3}min\b)/g, '<span class="time"><Timer size={16}/>$1</span>');

  // === Étape 2.3 — Convertir les températures
  let containsTemperature = /\b\d{1,3}\s?°C\b/.test(updatedContent);
  updatedContent = updatedContent.replace(/(\b\d{1,3}(?:°C)\b)/g, '<span class="temp"><Thermometer size={16}/>$1</span>');

  // Étape 3 – Convertir les callouts (version corrigée)
  let containsCallout = false;
  const calloutRegex = /^> \[!(\w+)\][^\n]*\n(?:^> .*\n?)*/gm;

  updatedContent = updatedContent.replace(/\r\n/g, '\n');
  updatedContent = updatedContent.replace(
    calloutRegex,
    (match) => {
      containsCallout = true;

      // Extraire la variante
      const variantMatch = match.match(/^>\s*\[!(\w+)\]/);
      const variant = variantMatch ? variantMatch[1].toLowerCase() : 'info';

      // Supprimer la première ligne (celle du header)
      const contentBlock = match
        .split(/\r?\n/)
        .slice(1) // retire la ligne du header
        .map(line => line.replace(/^>\s?/, '').trim())
        .filter(line => line.length > 0)
        .join('\n');

      return `<Callout variant="${variant}">\n${contentBlock}\n</Callout>\n`;
    }
  );

  // Step 1: Find all local image usages and prepare import statements
  const localImageRegex = /<Image\s+([^>]*?)src=["']([^"']+)["']([^>]*)\/>/g;
  let localImageImports = [];
  let usedImageVars = new Map(); // Map from path to variable name
  let imageVarCounter = 1;

  // Replace <Image src="..." ... /> with <Image src={var} ... /> for local images
  updatedContent = updatedContent.replace(localImageRegex, (match, beforeSrc, srcPath, afterSrc) => {
    // Only process local images (not starting with http or https)
    if (/^(https?:)?\//.test(srcPath)) {
      return match; // leave remote images as-is
    }
    // Normalize path and variable name
    let fileName = srcPath.split('/').pop().split('.')[0];
    let safeVar = 'img_'+fileName.replace(/[^a-zA-Z0-9_]/g, '_');

    // Ensure uniqueness
    let varName = safeVar;
    while ([...usedImageVars.values()].includes(varName)) {
      varName = safeVar + imageVarCounter++;
    }
    usedImageVars.set(srcPath, varName);
    // Compute relative import path (assume assets are in ../../assets/ from blog/)
    let importPath = srcPath;
    if (!importPath.startsWith('.')) {
      // Make sure it's relative
      importPath = '../' + importPath;
    }
    localImageImports.push(`import ${varName} from '${importPath}'`);
    // Replace src="..." with src={varName}
    return `<Image ${beforeSrc}src={${varName}}${afterSrc}/>`;
  });

  // Remove duplicate imports
  localImageImports = [...new Set(localImageImports)];

  // Collect other imports
  let importStatements = [];
  if (localImageImports.length > 0) {
    importStatements.push(...localImageImports);
  }
  if (containsCallout) {
    importStatements.push(`import Callout from '@/components/Callout.astro'`);
  }
  if (containsImage) {
    importStatements.push(`import { Image } from 'astro:assets'`);
  }
  if (containsTemperature || containsTime) {
    importStatements.push(`import { Thermometer, Timer } from 'lucide-react'`);
  }

  // === Étape 4 — Gérer banner dans le frontmatter
  if (data.banner) {
    const match = data.banner.match(/!\[\[([^\]]+\.(png|jpe?g|webp|gif|svg))\]\]/i);
    if (match) {
      const filename = match[1];
      data.image = getAssetRelativePathFromDest(destFile, filename);
    }
    delete data.banner;
  }

  const finalFrontmatter = {
    title: data.title || baseName,
    ...data,
    tags: Array.isArray(data.tags) ? data.tags : []
  };

  updatedContent = await removeSection(updatedContent, 'Ingrédients');

  if (importStatements.length > 0) {
    updatedContent = importStatements.join('\n') + '\n\n' + updatedContent;
  }
  const finalContent = matter.stringify(updatedContent, finalFrontmatter);

  await fs.ensureDir(articleFolder);
  await fs.writeFile(destFile, finalContent, 'utf-8');
  console.log(`✅ ${filePath} → ${destFile}`);
}

// Traite tous les fichiers markdown
async function processFiles() {
  for (const [sourceFolder, subMap] of Object.entries(folderMap)) {
    const sourcePath = path.join(SOURCE_DIR, sourceFolder);
    const baseOutput = subMap._out;

    if (!await fs.pathExists(sourcePath)) {
      console.warn(`⚠️  Missing folder: ${sourcePath}`);
      continue;
    }

    const entries = await fs.readdir(sourcePath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const rawPath = path.join(sourcePath, entry.name);
        await processFile(rawPath, baseOutput, null);
      }

      if (entry.isDirectory()) {
        const subIn = entry.name;
        const subOut = subMap[subIn];

        if (!subOut) {
          console.warn(`⚠️  No mapping for subfolder "${subIn}" in "${sourceFolder}"`);
          continue;
        }

        const subPath = path.join(sourcePath, subIn);
        const files = await fs.readdir(subPath);

        for (const file of files) {
          if (!file.endsWith('.md')) continue;
          const rawPath = path.join(subPath, file);
          await processFile(rawPath, baseOutput, subOut);
        }
      }
    }
  }
}

// Copie uniquement les images depuis le dossier "Assets"
async function copyGlobalAssets() {
  const sourceAssets = path.resolve(SOURCE_DIR, 'Assets');
  const destAssets = path.join(DEST_DIR, 'assets');

  const validExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];

  if (!await fs.pathExists(sourceAssets)) {
    console.warn(`⚠️ No global assets found at ${sourceAssets}`);
    return;
  }

  await fs.ensureDir(destAssets);

  const files = await fs.readdir(sourceAssets, { withFileTypes: true });

  for (const file of files) {
    if (file.isFile()) {
      const ext = path.extname(file.name).toLowerCase();
      if (validExtensions.includes(ext)) {
        const srcFile = path.join(sourceAssets, file.name);
        const destFile = path.join(destAssets, file.name);
        await fs.copy(srcFile, destFile);
        console.log(`🖼️ Copied image: ${file.name}`);
      } else {
        console.log(`⏭️ Skipped non-image file: ${file.name}`);
      }
    }
  }
}

// Exécution principale
(async () => {
  try {
    console.log('🚧 Generating content...');
    await cleanDest();
    await copyGlobalAssets();
    await processFiles();
    console.log('🎉 Content generation complete!');
  } catch (err) {
    console.error('❌ Error:', err);
  }
})();