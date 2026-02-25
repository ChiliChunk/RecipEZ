import type { Recipe } from '../types/recipe';
import { ScraperError } from './scraperError';

// --- HTML helpers ---

function extractAttr(tag: string, attr: string): string | null {
  const regex = new RegExp(`${attr}\\s*=\\s*"([^"]*)"`, 'i');
  const match = regex.exec(tag);
  return match ? match[1].trim() || null : null;
}

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
  const match = /data-src="([^"]+)"[\s\S]{0,300}?id="recipe-picture-print"/i.exec(html);
  return match ? match[1] : null;
}

function extractServings(html: string): string | null {
  const tag = /<div[\s\S]*?class="mrtn-recette_ingredients-counter"[\s\S]*?>/i.exec(html);
  if (tag) {
    const nb = extractAttr(tag[0], 'data-servingsNb');
    const unit = extractAttr(tag[0], 'data-servingsUnit');
    if (nb) return unit ? `${nb} ${unit}` : nb;
  }
  return null;
}

function extractIngredients(html: string): string[] {
  const blockStart = html.indexOf('class="mrtn-recette_ingredients-items"');
  if (blockStart === -1) return [];
  const blockHtml = html.slice(blockStart);

  const cards = splitBlocks(blockHtml, /<div[\s\S]*?class="card-ingredient"/);
  const ingredients: string[] = [];

  for (const card of cards.slice(1)) {
    const qtyTag = /class="card-ingredient-quantity"[\s\S]*?data-ingredientQuantity="([^"]+)"/i.exec(card);
    const qty = qtyTag ? qtyTag[1].trim() : '';

    const unitTag = /data-unitSingular="([^"]*)"/i.exec(card);
    const unit = unitTag ? unitTag[1].trim() : '';

    const nameTag = /data-ingredientNameSingular="([^"]+)"/i.exec(card);
    const name = nameTag ? nameTag[1].trim() : '';

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
  return blocks
    .slice(1)
    .map((block) => {
      const pMatch = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(block);
      return pMatch ? extractText(pMatch[1]) : '';
    })
    .filter(Boolean);
}

function extractTime(html: string, label: string): string | null {
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

export async function scrapeMarmiton(url: string, html: string): Promise<Recipe> {
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
