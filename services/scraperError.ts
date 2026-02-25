export class ScraperError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_URL' | 'NETWORK_ERROR' | 'NO_RECIPE_FOUND' | 'PARSE_ERROR' | 'UNSUPPORTED_SITE',
  ) {
    super(message);
    this.name = 'ScraperError';
  }
}
