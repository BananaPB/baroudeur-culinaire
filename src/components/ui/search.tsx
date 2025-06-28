import { formatDate } from '@/lib/utils';
import { type CollectionSearchResult, Search, WarmStart } from 'astro-collection-search';
import { useEffect } from "react";

function SearchClient() {
  useEffect(() => {
    initSearchComponent();
  }, []);
  return null;
}

function initSearchComponent() {
    WarmStart();

    const component = document.querySelector('.search-component') as HTMLElement;
    const max = component.dataset.max ? Number(component.dataset.max) : 0;
    const threshold = component.dataset.threshold ? Number(component.dataset.threshold) : 0;
    const resultsBlock = component.dataset.results ? component.dataset.results : "search-results";
    const contentBlock = component.dataset.content ? component.dataset.content : "search-none";
    const collection = component.dataset.collection ? component.dataset.collection : "";

    const input = component.querySelector('.query') as HTMLInputElement;
    const results = document.getElementById(resultsBlock) as HTMLElement;
    const content = document.getElementById(contentBlock) as HTMLElement;
    const titleTemplate = component.querySelector('.title-template') as HTMLTemplateElement;
    const template = component.querySelector('.result-template') as HTMLTemplateElement;

    const CreateLink = (result: CollectionSearchResult) => {
    let base = import.meta.env.BASE_URL || '/';
    if (!base.endsWith('/')) { base += '/'; }
    const slug = result.file.split("\\")
    slug.pop()
    const path = slug.join("/")
    const url = (base + result.collection + '/' + path).toLowerCase();

    return url;
    };

    const SetContent = (root: HTMLElement, data: Record<string, string|{ attributes: Record<string, string>}>) => {
    for (const [key, value] of Object.entries(data)) {
        const element = root.querySelector(`[data-target=${key}]`);
        if (element) {
        if (typeof value === 'string') {
            element.textContent = value;
        }
        else {
            for (const attribute of Object.entries(value.attributes)) {
            element.setAttribute(...attribute);
            }
        }
        }
    }
    return root;
    };

    const getTags = (tagsString: string) => {
    try {
        return JSON.parse(tagsString.replace(/'/g, '"'));
    } catch (e) {
        return [];
    }
    };

    const PopulateResults = (list: CollectionSearchResult[]) => {
    if (threshold) {
        list = list.filter(test => test.score >= threshold);
    }
    if (max) {
        list = list.slice(0, max);
    }

    if (!list.length) {
        results.textContent = 'Votre recherche ne donne aucun résultat.';
        return
    }

    const wrapper = titleTemplate.content.cloneNode(true) as HTMLElement;
    const ul = wrapper.querySelector('ul');
    if (!ul) return;

    results.textContent = '';
    ul.append(...list.map(result => {
        const clone = template.content.cloneNode(true) as HTMLElement;
        const tagEl = clone.querySelector('#tags');
        const tags = getTags(result.frontmatter.tags)
        const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hash-icon lucide-hash"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>`
        if (tagEl && tags && tags.length > 0) {
        tagEl.innerHTML = ''; // Clear any placeholder
        tags.forEach((tag: string) => {
            const span = document.createElement('span');
            span.className = 'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90';
            span.innerHTML = icon+tag;
            tagEl.appendChild(span);
        });
        }

        SetContent(clone, {
        title: result.frontmatter.title || 'No title',
        link: {attributes: {href: CreateLink(result)}},
        description: result.frontmatter.description || 'No description',
        date: formatDate(new Date(result.frontmatter.date)),
        file: result.file,
        collection: result.collection,
        score: result.score.toString(),
        });
        
        results.append(wrapper)
        return clone;
    }));
    };

    input.addEventListener('input', async () => {
    const query = input.value.trim();
    if (query) {
        let list = await Search(query);
        if(collection){
        list = list.filter(result => {
            return (result.collection === collection)
        })
        }
        PopulateResults(list);
        results.classList.remove('hidden')
        results.classList.add('flex')
        content.classList.add('hidden')
    }
    else {
        results.textContent = '';
        results.classList.add('hidden')
        results.classList.remove('flex')
        content.classList.remove('hidden')
    }
    });
}

export { SearchClient }