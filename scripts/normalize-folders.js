// scripts/normalize-folders.js
import fs from 'fs/promises'
import path from 'path'

const CONTENT_DIR = './src/content'

const renameMap = {
  'Recettes': 'recipes',
  'Théorie': 'theory',
  'Blog': 'blog'
}

async function normalizeFolders() {
  const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory() && renameMap[entry.name]) {
      const oldPath = path.join(CONTENT_DIR, entry.name)
      const newPath = path.join(CONTENT_DIR, renameMap[entry.name])
      console.log(`Renaming ${entry.name} → ${renameMap[entry.name]}`)
      await fs.rename(oldPath, newPath)
    }
  }
}

normalizeFolders()
  .then(() => console.log('Folder normalization done.'))
  .catch(console.error)