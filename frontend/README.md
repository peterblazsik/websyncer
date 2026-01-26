# WebSyncer - ARTIN Branding Asset Generator

AI-powered image generation tool for ARTIN brand assets using Google Imagen 4.0.

## Overview

WebSyncer generates premium marketing images for ARTIN (OrthoScan's hyperpersonalized orthopedic insole brand). Features include:

- **29 pre-configured image prompts** across 5 categories
- **Editable prompts** - customize any prompt before generation
- **Auto-save to filesystem** via local saver service
- **Batch generation** with progress tracking
- **Rate limit management** with VIP support

## Categories

| Category | Count | Description |
|----------|-------|-------------|
| Hero | 6 | Athletic action shots for homepage |
| Features | 4 | Product feature highlights |
| Process | 6 | Customer journey visualization |
| Lifestyle | 6 | Sports lifestyle photography |
| Product | 7 | Product gallery with multiple angles |

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Cloudflare Workers
- **AI**: Google Imagen 4.0 (Generative Language API)
- **Local Saver**: Node.js service with macOS Launch Agent

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## URLs

- **Frontend**: https://websyncer.pages.dev/branding
- **Backend API**: https://websyncer-api.orthoscan-pb.workers.dev
- **Local Saver**: http://localhost:3456 (when running)

## Project Structure

```
frontend/
  src/
    components/branding/   # UI components
      ImageCard.tsx        # Individual image card with editable prompt
      ImageGrid.tsx        # Grid layout for images
      CategorySelector.tsx # Category tabs
      BatchProgressModal.tsx
    lib/
      brandingConfig.ts    # Image specs and prompts (29 images)
      imageProcessing.ts   # WebP conversion utilities
    pages/
      BrandingGenerator.tsx # Main page component
    types/
      branding.ts          # TypeScript types

backend/
  src/
    index.ts              # Cloudflare Worker with rate limiting

local-saver/
  save-server.js          # Node.js filesystem saver
```

## Features

### Editable Prompts
Each image card has a collapsible prompt editor:
- Click "Prompt" to expand
- Edit the prompt text
- Amber dot indicates modifications
- "Reset to default" restores original prompt
- Custom prompts are passed to the API on generate

### Auto-Save
When the local saver service is running:
- Images are automatically saved to the target directory
- Timestamped filenames prevent overwrites: `YYYYMMDD-HHMMSS-{concept}.webp`
- Target: `/Users/peterblazsik/DevApps/O_S_v2/orthoscan-web/public/images`

### Rate Limiting
- VIP users: 30 requests/10min, 200/day (our limiter)
- Google API Tier 1: 70 requests/day (Google's limit)

## Testing

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run
```

Tests cover the ImageCard editable prompt feature:
- Prompt expansion/collapse
- Prompt modification detection
- Reset functionality
- Custom prompt submission

## Known Issues

- Google Imagen 4.0 safety filters block certain words ("teenage", age references)
- Google API has a hard 70/day limit for Tier 1 accounts

## Recent Changes (Jan 2025)

1. Added editable prompt feature to ImageCard
2. Updated all 29 prompts to:
   - Remove safety-triggering age references
   - Add ARTIN brand integration with theme-matching fonts
3. Increased VIP rate limits to 200/day
4. Set up Vitest test framework with 16 passing tests
