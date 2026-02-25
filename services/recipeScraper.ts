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
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
    });

    if (!response.ok) {
      throw new ScraperError(`Erreur HTTP ${response.status}`, 'NETWORK_ERROR');
    }

    return response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

// --- HTML helpers ---

// Extract a data attribute value from a tag string (handles multiline tags)
function extractAttr(tag: string, attr: string): string | null {
  const regex = new RegExp(`${attr}\\s*=\\s*"([^"]*)"`, 'i');
  const match = regex.exec(tag);
  return match ? match[1].trim() || null : null;
}

// Strip all HTML tags and decode common entities, collapse whitespace
function extractText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

// Split HTML into repeated blocks matched by a regex ([\s\S]*? between two anchors)
function splitBlocks(html: string, startPattern: RegExp): string[] {
  const results: string[] = [];
  const anchors: number[] = [];

  let match: RegExpExecArray | null;
  const g = new RegExp(startPattern.source, 'gi');
  while ((match = g.exec(html)) !== null) {
    anchors.push(match.index);
  }

  for (let i = 0; i < anchors.length; i++) {
    const start = anchors[i];
    const end = anchors[i + 1] ?? html.length;
    results.push(html.slice(start, end));
  }

  return results;
}

// --- Marmiton parsers ---

function extractTitle(html: string): string | null {
  const block = /<div[^>]+class="[^"]*main-title[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html);
  if (block) {
    const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(block[1]);
    if (h1) return extractText(h1[1]);
  }
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  return h1 ? extractText(h1[1]) : null;
}

function extractImage(html: string): string | null {
  // data-src appears a few lines BEFORE id="recipe-picture-print" in the same <img> tag
  const match = /data-src="([^"]+)"[\s\S]{0,300}?id="recipe-picture-print"/i.exec(html);
  return match ? match[1] : null;
}

function extractServings(html: string): string | null {
  // <div\n    class="mrtn-recette_ingredients-counter"\n    data-servingsNb="15"\n    data-servingsUnit="crêpes"\n>
  const tag = /<div[\s\S]*?class="mrtn-recette_ingredients-counter"[\s\S]*?>/i.exec(html);
  if (tag) {
    const nb = extractAttr(tag[0], 'data-servingsNb');
    const unit = extractAttr(tag[0], 'data-servingsUnit');
    if (nb) return unit ? `${nb} ${unit}` : nb;
  }
  return null;
}

function extractIngredients(html: string): string[] {
  // Isolate the ingredients items block
  const blockStart = html.indexOf('class="mrtn-recette_ingredients-items"');
  if (blockStart === -1) return [];
  const blockHtml = html.slice(blockStart);

  // Split on each card-ingredient opening tag
  const cards = splitBlocks(blockHtml, /<div[\s\S]*?class="card-ingredient"/);
  // First "block" is the container itself (before any card), skip it
  const ingredients: string[] = [];

  for (const card of cards.slice(1)) {
    // Quantity: use data-ingredientQuantity attribute (avoids multiline span content)
    const qtyTag = /class="card-ingredient-quantity"[\s\S]*?data-ingredientQuantity="([^"]+)"/i.exec(card);
    const qty = qtyTag ? qtyTag[1].trim() : '';

    // Unit: use data-unitSingular attribute
    const unitTag = /data-unitSingular="([^"]*)"/i.exec(card);
    const unit = unitTag ? unitTag[1].trim() : '';

    // Name: use data-ingredientNameSingular attribute
    const nameTag = /data-ingredientNameSingular="([^"]+)"/i.exec(card);
    const name = nameTag ? nameTag[1].trim() : '';

    // Complement: use data-ingredientComplementSingular attribute
    const compTag = /data-ingredientComplementSingular="([^"]*)"/i.exec(card);
    const complement = compTag ? compTag[1].trim() : '';

    if (!name) continue;

    const parts: string[] = [];
    if (qty) parts.push(qty);
    if (unit) parts.push(unit);
    if (qty || unit) parts.push('de');
    parts.push(name);
    if (complement) parts.push(complement);

    ingredients.push(parts.join(' '));
  }

  return ingredients;
}

function extractInstructions(html: string): string[] {
  const blocks = splitBlocks(html, /<div[^>]+class="recipe-step-list__container"/);
  // First block is content before the first step, skip it
  return blocks
    .slice(1)
    .map((block) => {
      const pMatch = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(block);
      return pMatch ? extractText(pMatch[1]) : '';
    })
    .filter(Boolean);
}

function extractTime(html: string, label: string): string | null {
  // Pattern (with possible &nbsp; or whitespace after colon):
  // <span>Préparation :</span>\n<div>10 min</div>
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(
    `${escaped}[^<]*<\\/span>\\s*<div>([^<]+)<`,
    'i',
  );
  const match = regex.exec(html);
  if (match) {
    const val = match[1].trim();
    return val === '-' ? null : val;
  }
  return null;
}

function extractTotalTime(html: string): string | null {
  const block = /<div[^>]+class="[^"]*time__total[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(html);
  if (block) {
    const divMatch = /<div>([^<]+)<\/div>/i.exec(block[1]);
    if (divMatch) {
      const val = divMatch[1].trim();
      return val === '-' ? null : val;
    }
  }
  return null;
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

  const title = extractTitle(html);
  const ingredients = extractIngredients(html);
  const instructions = extractInstructions(html);

  if (!title && ingredients.length === 0 && instructions.length === 0) {
    throw new ScraperError('Aucune recette trouvée sur cette page', 'NO_RECIPE_FOUND');
  }

  return {
    title: title ?? 'Sans titre',
    imageUrl: extractImage(html),
    ingredients,
    instructions,
    prepTime: extractTime(html, 'Préparation'),
    cookTime: extractTime(html, 'Cuisson'),
    totalTime: extractTotalTime(html),
    servings: extractServings(html),
    sourceUrl: url,
  };
}
