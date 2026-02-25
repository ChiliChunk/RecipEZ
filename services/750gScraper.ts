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

export function scrape750g(url: string, html: string): Recipe {
  const scriptRegex = /<script\s+type="application\/ld\+json"\s*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  let recipeData: any = null;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      if (json['@type'] === 'Recipe') {
        recipeData = json;
        break;
      }
    } catch {
      // skip malformed JSON-LD blocks
    }
  }

  if (!recipeData) {
    throw new ScraperError('Aucune recette trouvée sur cette page', 'NO_RECIPE_FOUND');
  }

  const title = recipeData.name ? decodeHtmlEntities(recipeData.name) : null;

  const imageUrl: string | null =
    typeof recipeData.image === 'string'
      ? recipeData.image
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

  if (!title && ingredients.length === 0 && instructions.length === 0) {
    throw new ScraperError('Aucune recette trouvée sur cette page', 'NO_RECIPE_FOUND');
  }

  return {
    title: title ?? 'Sans titre',
    imageUrl,
    ingredients,
    instructions,
    prepTime: recipeData.prepTime ? formatIsoDuration(recipeData.prepTime) : null,
    cookTime: recipeData.cookTime ? formatIsoDuration(recipeData.cookTime) : null,
    totalTime: recipeData.totalTime ? formatIsoDuration(recipeData.totalTime) : null,
    servings: recipeData.recipeYield ?? null,
    sourceUrl: url,
  };
}
