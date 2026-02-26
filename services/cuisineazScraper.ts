import type { Recipe } from '../types/recipe';
import { ScraperError } from './scraperError';

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&eacute;/g, 'é')
    .replace(/&egrave;/g, 'è')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&agrave;/g, 'à')
    .replace(/&acirc;/g, 'â')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&ucirc;/g, 'û')
    .replace(/&icirc;/g, 'î')
    .replace(/&uuml;/g, 'ü')
    .replace(/&ouml;/g, 'ö')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&nbsp;/g, ' ')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Egrave;/g, 'È')
    .replace(/&Agrave;/g, 'À')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function formatIsoDuration(iso: string): string | null {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i.exec(iso);
  if (!match) return null;

  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;

  const parts: string[] = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes || parts.length === 0) parts.push(`${minutes} min`);
  return parts.join(' ');
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

// --- JSON-LD extraction ---

function findRecipeJsonLd(html: string): any | null {
  const scriptRegex = /<script\s+type="application\/ld\+json"\s*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1]);

      // Direct Recipe object
      if (json['@type'] === 'Recipe') return json;

      // @graph array (CuisineAZ wraps in a graph)
      if (Array.isArray(json['@graph'])) {
        const recipe = json['@graph'].find((item: any) => item['@type'] === 'Recipe');
        if (recipe) return recipe;
      }
    } catch {
      // skip malformed JSON-LD blocks
    }
  }

  return null;
}

// --- HTML fallback parsers ---

function extractTitleHtml(html: string): string | null {
  const match = /<h1[^>]+class="[^"]*recipe-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  return match ? extractText(match[1]) : null;
}

function extractImageHtml(html: string): string | null {
  const sectionMatch = /<section[^>]+id="recipe_image"[^>]*>([\s\S]*?)<\/section>/i.exec(html);
  if (!sectionMatch) return null;

  // Prefer desktop source (min-width: 640px)
  const sourceMatch = /media="[^"]*min-width[^"]*"[^>]+srcset="([^"\s]+)/i.exec(sectionMatch[1]);
  if (sourceMatch) return sourceMatch[1];

  // Fallback: any img src
  const imgMatch = /src="(https?:\/\/[^"]+)"/i.exec(sectionMatch[1]);
  return imgMatch ? imgMatch[1] : null;
}

function extractIngredientsHtml(html: string): string[] {
  const listStart = html.indexOf('class="ingredient_list"');
  if (listStart === -1) return [];
  const listEnd = html.indexOf('</ul>', listStart);
  const listHtml = listStart !== -1 && listEnd !== -1 ? html.slice(listStart, listEnd) : '';

  const itemRegex = /<li[^>]+class="[^"]*ingredient_item[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  const ingredients: string[] = [];
  let itemMatch: RegExpExecArray | null;

  while ((itemMatch = itemRegex.exec(listHtml)) !== null) {
    const itemHtml = itemMatch[1];
    const labelMatch = /class="[^"]*ingredient_label[^"]*"[^>]*>([\s\S]*?)<\/span>/i.exec(itemHtml);
    const qteMatch = /class="[^"]*ingredient_qte[^"]*"[^>]*>([\s\S]*?)<\/span>/i.exec(itemHtml);

    const label = labelMatch ? extractText(labelMatch[1]) : '';
    const qte = qteMatch ? extractText(qteMatch[1]) : '';

    if (!label) continue;
    ingredients.push(qte ? `${qte} ${label}` : label);
  }

  return ingredients;
}

function extractInstructionsHtml(html: string): string[] {
  const listStart = html.indexOf('class="preparation_steps"');
  if (listStart === -1) return [];
  const listEnd = html.indexOf('</ul>', listStart);
  const listHtml = listStart !== -1 && listEnd !== -1 ? html.slice(listStart, listEnd) : '';

  const stepRegex = /<li[^>]+class="[^"]*preparation_step[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  const instructions: string[] = [];
  let stepMatch: RegExpExecArray | null;

  while ((stepMatch = stepRegex.exec(listHtml)) !== null) {
    const pMatch = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(stepMatch[1]);
    if (pMatch) {
      const text = extractText(pMatch[1]);
      if (text) instructions.push(text);
    }
  }

  return instructions;
}

function extractTimeHtml(html: string, label: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(
    `class="recipe_time_information_title"[^>]*>\\s*${escaped}\\s*<\\/p>[\\s\\S]*?class="recipe_time_information"[^>]*>([^<]+)<`,
    'i',
  );
  const match = regex.exec(html);
  return match ? match[1].trim() || null : null;
}

function extractServingsHtml(html: string): string | null {
  const match = /class="[^"]*recipe_utils_information[^"]*"[^>]*>([^<]+)<\/p>/i.exec(html);
  return match ? match[1].trim() || null : null;
}

// --- Main export ---

export function scrapeCuisineAZ(url: string, html: string): Recipe {
  const recipeData = findRecipeJsonLd(html);

  if (recipeData) {
    const title = recipeData.name ? decodeHtmlEntities(recipeData.name) : null;

    const imageUrl: string | null =
      typeof recipeData.image === 'string'
        ? recipeData.image
        : Array.isArray(recipeData.image)
          ? recipeData.image[0] ?? null
          : recipeData.image?.url ?? null;

    const ingredients: string[] = Array.isArray(recipeData.recipeIngredient)
      ? recipeData.recipeIngredient.map((i: string) => decodeHtmlEntities(i))
      : [];

    const instructions: string[] = Array.isArray(recipeData.recipeInstructions)
      ? recipeData.recipeInstructions
          .map((step: any) => {
            const text = typeof step === 'string' ? step : step?.text;
            return text ? decodeHtmlEntities(text) : '';
          })
          .filter(Boolean)
      : [];

    if (title || ingredients.length > 0 || instructions.length > 0) {
      return {
        title: title ?? 'Sans titre',
        imageUrl,
        ingredients,
        instructions,
        prepTime: recipeData.prepTime ? formatIsoDuration(recipeData.prepTime) : null,
        cookTime: recipeData.cookTime ? formatIsoDuration(recipeData.cookTime) : null,
        totalTime: recipeData.totalTime ? formatIsoDuration(recipeData.totalTime) : null,
        servings: recipeData.recipeYield ? String(recipeData.recipeYield) : null,
        sourceUrl: url,
      };
    }
  }

  // HTML fallback
  const title = extractTitleHtml(html);
  const ingredients = extractIngredientsHtml(html);
  const instructions = extractInstructionsHtml(html);

  if (!title && ingredients.length === 0 && instructions.length === 0) {
    throw new ScraperError('Aucune recette trouvée sur cette page', 'NO_RECIPE_FOUND');
  }

  return {
    title: title ?? 'Sans titre',
    imageUrl: extractImageHtml(html),
    ingredients,
    instructions,
    prepTime: extractTimeHtml(html, 'Préparation'),
    cookTime: extractTimeHtml(html, 'Cuisson'),
    totalTime: extractTimeHtml(html, 'Temps total'),
    servings: extractServingsHtml(html),
    sourceUrl: url,
  };
}
