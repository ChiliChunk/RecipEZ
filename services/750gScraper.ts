import type { Recipe } from "../types/recipe";
import { ScraperError } from "./scraperError";

function decodeHtmlEntities(text: string): string {
  // First, decode common named entities
  const namedEntities: { [key: string]: string } = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    eacute: "é",
    egrave: "è",
    ecirc: "ê",
    agrave: "à",
    acirc: "â",
    ocirc: "ô",
    ucirc: "û",
    icirc: "î",
    uuml: "ü",
    ouml: "ö",
    ccedil: "ç",
    Eacute: "É",
    Egrave: "È",
    Agrave: "À",
  };

  let result = text;

  // Replace named entities
  Object.entries(namedEntities).forEach(([entity, char]) => {
    result = result.replace(new RegExp(`&${entity};`, "g"), char);
  });

  // Replace numeric entities (&#123; and &#x1A;)
  result = result.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(Number(code)),
  );
  result = result.replace(/&#x([a-fA-F0-9]+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 16)),
  );

  return result;
}

function formatIsoDuration(iso: string): string | null {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i.exec(iso);
  if (!match) return null;

  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;

  const parts: string[] = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes || parts.length === 0) parts.push(`${minutes} min`);
  return parts.join(" ");
}

export function scrape750g(url: string, html: string): Recipe {
  // Use a more flexible regex that handles various whitespace and attribute orders
  const scriptRegex =
    /<script\s+[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  let recipeData: any = null;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      // Fix literal newlines inside JSON strings (real-world 750g malformed output)
      const sanitized = match[1].replace(
        /"((?:[^"\\]|\\.)*)"/gs,
        (_, inner) => `"${inner.replace(/\n/g, "\\n").replace(/\r/g, "\\r")}"`,
      );
      const json = JSON.parse(sanitized);
      if (json["@type"] === "Recipe") {
        recipeData = json;
        break;
      }
    } catch (error) {
      // skip malformed JSON-LD blocks
      console.error("Error parsing JSON-LD block:", error);
    }
  }

  if (!recipeData) {
    throw new ScraperError(
      "Aucune recette trouvée sur cette page",
      "NO_RECIPE_FOUND",
    );
  }

  const title = recipeData.name ? decodeHtmlEntities(recipeData.name) : null;

  const imageUrl: string | null =
    typeof recipeData.image === "string"
      ? recipeData.image
      : (recipeData.image?.url ?? null);

  const ingredients: string[] = Array.isArray(recipeData.recipeIngredient)
    ? recipeData.recipeIngredient.map((i: string) => decodeHtmlEntities(i))
    : [];

  const instructions: string[] = Array.isArray(recipeData.recipeInstructions)
    ? recipeData.recipeInstructions
        .map((step: any) => {
          const text = typeof step === "string" ? step : step?.text;
          return text ? decodeHtmlEntities(text) : "";
        })
        .filter(Boolean)
    : [];

  if (!title && ingredients.length === 0 && instructions.length === 0) {
    throw new ScraperError(
      "Aucune recette trouvée sur cette page",
      "NO_RECIPE_FOUND",
    );
  }

  return {
    title: title ?? "Sans titre",
    imageUrl,
    ingredients,
    instructions,
    prepTime: recipeData.prepTime
      ? formatIsoDuration(recipeData.prepTime)
      : null,
    cookTime: recipeData.cookTime
      ? formatIsoDuration(recipeData.cookTime)
      : null,
    totalTime: recipeData.totalTime
      ? formatIsoDuration(recipeData.totalTime)
      : null,
    servings: recipeData.recipeYield ?? null,
    sourceUrl: url,
  };
}
