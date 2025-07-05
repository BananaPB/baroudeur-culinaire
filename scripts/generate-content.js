import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import slugify from 'slugify';

// Permet d'émuler __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dossiers source/destination
const SOURCE_DIR = path.resolve(__dirname, '../content-obsidian');
const DEST_DIR = path.resolve(__dirname, '../src/content');

// Map des dossiers principaux et secondaires
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

// Nettoyer src/content
async function cleanDest() {
  await fs.emptyDir(DEST_DIR);
  console.log(`🧹 Cleaned ${DEST_DIR}`);
}

// Traite un seul fichier
async function processFile(filePath, baseCategory, subCategory = null) {
  const rawContent = await fs.readFile(filePath, 'utf-8');
  const { content, data } = matter(rawContent);

  const ext = path.extname(filePath);
  const baseName = path.basename(filePath, ext);
  const slug = slugify(baseName, { lower: true, strict: true });

  const fullCategory = subCategory || baseCategory;
  const finalFrontmatter = {
    title: data.title || baseName,
    slug: data.slug || slug,
    category: fullCategory,
    ...data
  };

  const finalContent = matter.stringify(content, finalFrontmatter);

  const destFolder = path.join(DEST_DIR, baseCategory, ...(subCategory ? [subCategory] : []));
  const destFile = path.join(destFolder, `${slug}.md`);

  await fs.ensureDir(destFolder);
  await fs.writeFile(destFile, finalContent, 'utf-8');

  console.log(`✅ ${filePath} → ${destFile}`);
}

// Traite les fichiers d’un dossier principal
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

// Lancer le script
(async () => {
  try {
    console.log('🚧 Generating content with nested folders...');
    await cleanDest();
    await processFiles();
    console.log('🎉 Content generation complete!');
  } catch (err) {
    console.error('❌ Error:', err);
  }
})();