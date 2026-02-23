import type { Recipe } from '../types/recipe';

export class ScraperError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_URL' | 'NETWORK_ERROR' | 'NO_RECIPE_FOUND' | 'PARSE_ERROR',
  ) {
    super(message);
    this.name = 'ScraperError';
  }
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RecipEZ/1.0)',
        Accept: 'text/html',
      },
    });

    if (!response.ok) {
      throw new ScraperError(
        `Erreur HTTP ${response.status}`,
        'NETWORK_ERROR',
      );
    }

    return response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

// --- JSON-LD extraction ---

function extractJsonLdBlocks(html: string): unknown[] {
  const regex = /<script\s+type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks: unknown[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      // skip malformed JSON-LD
    }
  }

  return blocks;
}

function findRecipeObject(obj: unknown): Record<string, unknown> | null {
  if (!obj || typeof obj !== 'object') return null;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findRecipeObject(item);
      if (found) return found;
    }
    return null;
  }

  const record = obj as Record<string, unknown>;

  if (record['@type'] === 'Recipe') return record;
  if (Array.isArray(record['@type']) && record['@type'].includes('Recipe')) return record;

  if (Array.isArray(record['@graph'])) {
    return findRecipeObject(record['@graph']);
  }

  return null;
}

// --- Normalization helpers ---

function normalizeString(value: unknown): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return normalizeString(value[0]);
  return null;
}

function normalizeImage(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return normalizeImage(value[0]);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.url === 'string') return obj.url;
  }
  return null;
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : null))
      .filter((item): item is string => item !== null && item !== '');
  }
  if (typeof value === 'string') {
    return value.split('\n').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function normalizeInstructions(value: unknown): string[] {
  if (typeof value === 'string') {
    return value.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  }
  if (!Array.isArray(value)) return [];

  const steps: string[] = [];
  for (const item of value) {
    if (typeof item === 'string') {
      steps.push(item.trim());
    } else if (item && typeof item === 'object') {
      const obj = item as Record<string, unknown>;
      if (obj['@type'] === 'HowToStep' && typeof obj.text === 'string') {
        steps.push(obj.text.trim());
      } else if (obj['@type'] === 'HowToSection' && Array.isArray(obj.itemListElement)) {
        steps.push(...normalizeInstructions(obj.itemListElement));
      }
    }
  }
  return steps.filter(Boolean);
}

function normalizeRecipe(raw: Record<string, unknown>, sourceUrl: string): Recipe {
  return {
    title: normalizeString(raw.name) ?? 'Sans titre',
    imageUrl: normalizeImage(raw.image),
    ingredients: normalizeStringArray(raw.recipeIngredient),
    instructions: normalizeInstructions(raw.recipeInstructions),
    prepTime: normalizeString(raw.prepTime),
    cookTime: normalizeString(raw.cookTime),
    totalTime: normalizeString(raw.totalTime),
    servings: normalizeString(raw.recipeYield),
    sourceUrl,
  };
}

// --- Meta tags fallback ---

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractMetaContent(html: string, property: string): string | null {
  const escaped = escapeRegex(property);
  const regex = new RegExp(
    `<meta\\s+(?:[^>]*?(?:property|name)\\s*=\\s*["']${escaped}["'][^>]*?content\\s*=\\s*["']([^"']*?)["']|[^>]*?content\\s*=\\s*["']([^"']*?)["'][^>]*?(?:property|name)\\s*=\\s*["']${escaped}["'])`,
    'i',
  );
  const match = regex.exec(html);
  return match ? (match[1] ?? match[2])?.trim() || null : null;
}

function extractHtmlTitle(html: string): string | null {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return match ? match[1].trim() || null : null;
}

function extractFromMetaTags(html: string, sourceUrl: string): Recipe | null {
  const title =
    extractMetaContent(html, 'og:title') ?? extractHtmlTitle(html);

  if (!title) return null;

  return {
    title,
    imageUrl: extractMetaContent(html, 'og:image'),
    ingredients: [],
    instructions: [],
    prepTime: null,
    cookTime: null,
    totalTime: null,
    servings: null,
    sourceUrl,
  };
}

// --- Main export ---

export async function scrapeRecipe(url: string): Promise<Recipe> {
  if (!isValidUrl(url)) {
    throw new ScraperError('URL invalide', 'INVALID_URL');
  }

  let html: string;
  try {
    html = await fetchHtml(url);
  } catch (error) {
    if (error instanceof ScraperError) throw error;
    throw new ScraperError(
      `Erreur réseau: ${error instanceof Error ? error.message : 'inconnue'}`,
      'NETWORK_ERROR',
    );
  }

  // Try JSON-LD first
  const jsonLdBlocks = extractJsonLdBlocks(html);
  const rawRecipe = findRecipeObject(jsonLdBlocks);

  if (rawRecipe) {
    return normalizeRecipe(rawRecipe, url);
  }

  // Fallback to meta tags
  const metaRecipe = extractFromMetaTags(html, url);
  if (metaRecipe) {
    return metaRecipe;
  }

  throw new ScraperError(
    'Aucune recette trouvée sur cette page',
    'NO_RECIPE_FOUND',
  );
}
