import type { Recipe } from '../types/recipe';
import { ScraperError } from './scraperError';
import { scrapeMarmiton } from './marmitonScraper';
import { scrape750g } from './750gScraper';
import { scrapeCuisineAZ } from './cuisineazScraper';

export { ScraperError };

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isMarmiton(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === 'www.marmiton.org' || hostname === 'marmiton.org';
  } catch {
    return false;
  }
}

function is750g(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === 'www.750g.com' || hostname === '750g.com';
  } catch {
    return false;
  }
}

function isCuisineAZ(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === 'www.cuisineaz.com' || hostname === 'cuisineaz.com';
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

export async function scrapeRecipe(url: string): Promise<Recipe> {
  if (!isValidUrl(url)) {
    throw new ScraperError('URL invalide', 'INVALID_URL');
  }

  if (!isMarmiton(url) && !is750g(url) && !isCuisineAZ(url)) {
    throw new ScraperError(
      "Ce site n'est pas encore supporté. Seules les recettes Marmiton, 750g et CuisineAZ sont importables pour le moment.",
      'UNSUPPORTED_SITE',
    );
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

  if (is750g(url)) {
    return scrape750g(url, html);
  }

  if (isCuisineAZ(url)) {
    return scrapeCuisineAZ(url, html);
  }

  return scrapeMarmiton(url, html);
}
