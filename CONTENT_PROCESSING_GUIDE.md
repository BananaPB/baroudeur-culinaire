# Content Processing Guide

This guide explains how to process and highlight words in your recipe content while preserving HTML structure.

## How Content Rendering Works

In your Astro application, content rendering follows this flow:

1. **Content Source**: Markdown files in `src/content/recipes/`
2. **Content Processing**: Astro's `render()` function processes the markdown
3. **DOM Rendering**: The processed content is rendered as HTML using `<Content />`
4. **Client-side Processing**: JavaScript can then manipulate the rendered DOM

## Client-Side Content Highlighting

### Location: `src/lib/content-dom-processor.js`

The client-side approach highlights words in the rendered HTML DOM by wrapping them in `<span class="highlight">` tags:

```javascript
import { highlightWordsInContent, countWordOccurrences } from '@/lib/content-dom-processor.js'

document.addEventListener('astro:page-load', () => {
  const article = document.querySelector('article')
  
  // Highlight words
  const wordsToHighlight = ['chocolate', 'butter', 'flour', 'sugar']
  highlightWordsInContent(article, wordsToHighlight)
  
  // Count occurrences
  const counts = countWordOccurrences(article, wordsToHighlight)
  console.log('Word counts:', counts)
})
```

### Available Functions

- `highlightWordsInContent(article, words)` - Highlight multiple words
- `highlightTextInNode(node, searchText)` - Highlight text in a specific node
- `countWordOccurrences(article, words)` - Count word occurrences
- `highlightRecipeContent(article, includeIngredients, includeMeasurements)` - Highlight common recipe terms

## Implementation in Recipe Pages

### Current Implementation: `src/pages/recipes/[...id].astro`

The recipe page currently uses client-side highlighting:

```javascript
// Function to safely highlight text in DOM nodes while preserving HTML structure
function highlightTextInNode(node, searchText) {
  if (node.nodeType === Node.TEXT_NODE) {
    // This is a text node, safe to highlight
    const regex = new RegExp(`\\b${searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    if (regex.test(node.textContent)) {
      const highlightedText = node.textContent.replace(regex, (match) => {
        return `<span class="highlight">${match}</span>`
      })
      
      // Create a temporary container to parse the HTML
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = highlightedText
      
      // Replace the text node with the highlighted content
      const parent = node.parentNode
      const fragment = document.createDocumentFragment()
      
      // Move all child nodes from tempDiv to fragment
      while (tempDiv.firstChild) {
        fragment.appendChild(tempDiv.firstChild)
      }
      
      parent.replaceChild(fragment, node)
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    // This is an element node, recursively process its children
    // Skip script and style tags to avoid breaking functionality
    if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') {
      return
    }
    
    // Process all child nodes (create a copy to avoid issues with live NodeList)
    const childNodes = Array.from(node.childNodes)
    childNodes.forEach(child => highlightTextInNode(child, searchText))
  }
}

// Function to highlight multiple words in article content
function highlightWordsInContent(article, words) {
  if (!article) return

  words.forEach(word => {
    highlightTextInNode(article, word)
  })
}

// Example usage
const wordsToHighlight = ['chocolate', 'butter', 'flour', 'sugar']
highlightWordsInContent(article, wordsToHighlight)
```

## CSS Styling

### Location: `src/styles/global.css`

The highlighting is styled with CSS that supports both light and dark themes:

```css
/* Highlight styles for content processing */
.highlight {
  background-color: oklch(0.7251 0.1376 53.82 / 0.2);
  color: oklch(0.1353 0.0288 70.3);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-weight: 500;
  text-decoration: none;
  transition: background-color 0.2s ease;
}

.highlight:hover {
  background-color: oklch(0.7251 0.1376 53.82 / 0.3);
}

[data-theme='dark'] .highlight {
  background-color: oklch(0.5668 0.1395 50.16 / 0.2);
  color: oklch(0.9728 0.0152 61.35);
}

[data-theme='dark'] .highlight:hover {
  background-color: oklch(0.5668 0.1395 50.16 / 0.3);
}
```

## Key Features

### 1. HTML Structure Preservation
The functions only modify text nodes, preserving all HTML elements, attributes, and structure.

### 2. Word Boundary Matching
Uses regex with word boundaries (`\b`) to ensure only complete words are highlighted, not partial matches.

### 3. Case-Insensitive Matching
Uses the `gi` flag for case-insensitive, global matching.

### 4. Safe Processing
Skips `SCRIPT` and `STYLE` tags to avoid breaking functionality.

### 5. Recursive Processing
Traverses the entire DOM tree to find all text nodes.

### 6. Visual Highlighting
Wraps matched words in `<span class="highlight">` tags with custom styling.

## Usage Examples

### Basic Word Highlighting
```javascript
const wordsToHighlight = ['flour', 'sugar', 'butter']
highlightWordsInContent(article, wordsToHighlight)
```

### Count Word Occurrences
```javascript
const counts = countWordOccurrences(article, ['chocolate', 'butter', 'flour'])
console.log(counts) // { chocolate: 3, butter: 2, flour: 1 }
```

### Recipe-Specific Highlighting
```javascript
// Highlight common recipe ingredients and measurements
highlightRecipeContent(article, true, true)
```

### Custom Highlighting
```javascript
// Highlight specific cooking terms
const cookingTerms = ['mix', 'fold', 'knead', 'whisk']
highlightWordsInContent(article, cookingTerms)
```

## Customization

### Adding New Highlight Sets
You can create custom highlight sets in `content-dom-processor.js`:

```javascript
export function createCookingMethodHighlights() {
  return [
    'mix', 'fold', 'knead', 'whisk', 'stir', 'beat', 'cream'
  ]
}
```

### Custom CSS Styling
You can customize the highlight appearance by modifying the CSS:

```css
.highlight {
  background-color: #ffeb3b;
  color: #000;
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: bold;
}
```

## Best Practices

1. **Test Thoroughly**: Always test highlighting to ensure it doesn't break content
2. **Use Word Boundaries**: Always use word boundaries to avoid partial highlights
3. **Consider Context**: Choose words that are meaningful to highlight
4. **Performance**: For large content, consider limiting the number of highlighted words
5. **User Experience**: Make highlights that improve readability and understanding

## Troubleshooting

### Common Issues

1. **Highlights Not Working**: Check that the article element exists
2. **Partial Word Highlighting**: Ensure you're using word boundaries (`\b`)
3. **HTML Breaking**: Verify you're only modifying text nodes
4. **Performance Issues**: Consider limiting the number of highlighted words

### Debugging

Use the `countWordOccurrences` function to see which words are found:

```javascript
const counts = countWordOccurrences(article, ['chocolate', 'butter'])
console.log('Found words:', counts)
```

### Visual Testing

You can temporarily change the highlight CSS to make it more visible:

```css
.highlight {
  background-color: red !important;
  color: white !important;
}
``` 