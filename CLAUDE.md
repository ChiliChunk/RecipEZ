# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server (scan QR with Expo Go app)
npm run android    # Launch on Android emulator
npm run ios        # Launch on iOS simulator
npm run web        # Run in browser
```

No test runner is configured. No lint script is defined.

## Architecture

RecipEZ is a React Native/Expo app (TypeScript) for importing and viewing recipes scraped from the web. It is fully localized in French.

**Two-screen navigation** is managed directly in `App.js` via `useState` — no navigation library. The `selectedRecipe` state determines which screen renders: `null` → `Home`, recipe object → `RecipeDetail`.

**Data flow:**
1. User pastes a URL in `screens/Home.tsx`
2. `services/recipeScraper.ts` fetches the page and extracts recipe data:
   - Primary: JSON-LD structured data (`<script type="application/ld+json">`)
   - Fallback: OpenGraph meta tags
3. The `Recipe` object (typed in `types/recipe.ts`) is passed up to `App.js` and down to `screens/RecipeDetail.tsx`

**Key files:**
- `services/recipeScraper.ts` — all scraping logic; uses a custom `ScraperError` class with error codes (`INVALID_URL`, `NETWORK_ERROR`, `NO_RECIPE_FOUND`, `PARSE_ERROR`)
- `styles/theme.js` — single source of truth for colors, spacing, typography, and shadows; import from here for any UI work
- `types/recipe.ts` — the central `Recipe` interface

**Theme colors** (warm culinary palette):
- Primary: `#FF8C42` (orange), Background: `#FFF8F2` (cream), Text: `#2D1810` (dark brown)

## Expo / React Native Notes

- New Architecture is enabled (`newArchEnabled: true` in `app.json`)
- `ios/` and `android/` folders are gitignored — native builds go through Expo
- Entry point is `index.js` (registers `App` via `expo`)
