# WebSyncer - Current State (Jan 25, 2025)

## Project Overview
WebSyncer is an AI image generation tool with a Branding module for ARTIN (OrthoScan's athletic insole brand).

## Architecture
- **Frontend:** React 19 + Vite + TypeScript + Tailwind CSS 4
- **Backend:** Cloudflare Workers with Hono framework
- **API:** Google Imagen 4.0 via Generative Language API
- **Rate Limiting:** Cloudflare KV storage

## URLs
- **Frontend:** https://websyncer.pages.dev
- **Backend API:** https://websyncer-api.orthoscan-pb.workers.dev
- **Branding Page:** https://websyncer.pages.dev/branding

## Current Status: WORKING ✓

### What's Implemented
1. **Branding Module** - 5 images (1 per category: Hero, Features, Process, Lifestyle, Product)
2. **VIP Whitelist** - Peter's IPv6 whitelisted for 100/day, 20/10min limits
3. **Safe Prompts** - No age-related words (Google blocks "young", "teenager", specific ages)
4. **Versioned Naming** - `{section}-{concept}-v{n}.webp` for rotation support

### IP Whitelist (backend/src/index.ts)
```typescript
const WHITELIST_IPS = [
    '24.132.177.218',  // Peter's IPv4
    '2001:1c08:70e:bb00:ad06:f5c5:ab2e:6dda',  // Peter's IPv6
];
```
- VIP limits: 20/10min, 100/day
- Regular limits: 10/10min, 25/day

## Imagen 4.0 Constraints (CRITICAL)

### Supported Aspect Ratios ONLY
- `1:1` - Social media, thumbnails, product shots
- `3:4` - Portrait orientation
- `4:3` - Blog posts, general web content
- `9:16` - Mobile stories, vertical banners
- `16:9` - Hero images, website headers, presentations

### Deprecated Parameters (Jan 2025)
- ❌ **negativePrompt** - No longer supported, causes 400 Bad Request
- Backend ignores negativePrompt even if sent

### Banned Words (Safety Filters)
These trigger safety filters and return empty responses (400 errors):
- "young", "teenager", "child", "kid"
- Specific ages (14-16, 13-14, etc.)
- Age-related descriptors

### Prompt Formula (Best Practice)
```
[Style] [Subject] [Composition] [Context/Atmosphere]
```

Example:
```
Professional sports photography, athletic runner in powerful mid-stride pose,
modern black and orange athletic shoes with custom performance insoles visible,
dramatic rim lighting from behind, pure charcoal black background,
premium athletic brand campaign aesthetic with high contrast
```

## Naming Convention

### Structure
```
{section}-{concept}-v{version}.webp
```

### Examples
```
hero/
├── hero-athletic-v1.webp      # First generation
├── hero-athletic-v2.webp      # Second variant
├── hero-craft-v1.webp
└── hero-tech-v1.webp

features/
├── feature-orthopedic-v1.webp
├── feature-orthopedic-v2.webp
├── feature-ai-v1.webp
└── feature-fit-v1.webp

process/
├── step-scan-v1.webp
├── step-design-v1.webp
└── step-receive-v1.webp

lifestyle/
├── lifestyle-soccer-v1.webp
├── lifestyle-basketball-v1.webp
└── lifestyle-running-v1.webp

product/
├── dragon-fire/
│   ├── topdown-v1.webp
│   ├── angled-v1.webp
│   ├── profile-v1.webp
│   └── macro-v1.webp
└── warrior-flow/
    └── ...
```

## Key Files

### Frontend
- `frontend/src/pages/BrandingGenerator.tsx` - Main branding page
- `frontend/src/lib/brandingConfig.ts` - Image specs with prompts & versioning
- `frontend/src/types/branding.ts` - TypeScript types with version support
- `frontend/src/components/branding/` - UI components
- `frontend/.env.production` - API URL config

### Backend
- `backend/src/index.ts` - API endpoints, rate limiting, IP whitelist
- `backend/wrangler.toml` - Cloudflare Workers config

## Deployment Commands
```bash
# Deploy backend
cd backend && npx wrangler deploy

# Build & deploy frontend
cd frontend && npm run build
npx wrangler pages deploy dist --project-name=websyncer
```

## Debug Endpoint
Check your IP and VIP status: https://websyncer-api.orthoscan-pb.workers.dev/api/rate-limit-status

## Recent Fixes Applied
1. ✅ Changed unsupported aspect ratios (7:5, 3:2, 7:4) to supported ones (4:3, 16:9)
2. ✅ Removed age references from prompts that triggered safety filters
3. ✅ Added IPv6 address to whitelist (browser was using IPv6)
4. ✅ Fixed API URL in .env.production
5. ✅ **Removed negativePrompt** - No longer supported by Imagen 4.0 (Jan 2025)
6. ✅ Improved error logging to show full API error details
7. ✅ Updated naming convention to versioned format for rotation support

## Claude Code Skills for Imagen
Recommended skill: [guinacio/claude-image-gen](https://github.com/guinacio/claude-image-gen)
```bash
/plugin install guinacio/claude-image-gen
```

## Prompt Crafting Reference

### Style Keywords
- **Photographic:** Studio photography, editorial, product photography, lifestyle, aerial
- **Digital Art:** 3D render, flat illustration, isometric, gradient mesh
- **Aesthetic:** Minimalist, premium, professional, modern, clean

### Lighting Terms
| Term | Effect |
|------|--------|
| Golden hour | Warm, soft, romantic |
| Rim lighting | Edge definition, silhouette |
| Soft box | Even, professional, studio |
| Dramatic lighting | High contrast, deep shadows |
| Backlit | Glowing edges |

### Composition
- Centered, rule of thirds, negative space
- Close-up, wide shot, bird's eye
- Flat lay (top-down product shots)

### Color Palette
- **Brand:** Black (#000000), Orange accents, White text
- **Moody:** Charcoal, dark tones, dramatic contrast
- **Premium:** Gold accents, deep shadows
