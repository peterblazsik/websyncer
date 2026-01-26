# CLAUDE.md - WebSyncer Platform

## Project Overview

**WebSyncer** is a unified image processing and AI marketing platform combining:
- AI-powered marketing campaign image generation (Gemini/Imagen)
- WebP image conversion with size variants
- App Store screenshot generation (iOS device sizes)
- App Icon generator (iOS, macOS, PNG, WebP, JPG)

## Tech Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Routing**: React Router DOM

### Backend
- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **AI Integration**: Google Gemini/Imagen API
- **Rate Limiting**: Cloudflare KV

## Directory Structure

```
orthoscan-marketing/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/      # Route pages
│   │   ├── lib/        # Utilities (image processing, downloads)
│   │   └── types.ts    # TypeScript interfaces
│   └── public/assets/  # Static assets (logo)
├── backend/            # Cloudflare Workers API
│   ├── src/index.ts    # API endpoints
│   └── wrangler.toml   # Worker configuration
└── .claude/skills/     # Claude skills for development
```

## Development Commands

### Frontend
```bash
cd frontend
npm run dev      # Start dev server (localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
```

### Backend
```bash
cd backend
npm run dev      # Start worker dev (localhost:8787)
npm run deploy   # Deploy to Cloudflare
```

## Design System (Under Armour Style)

- **Background**: #0a0a0a (near-black)
- **Secondary**: #1a1a1a (charcoal)
- **Border**: #333333
- **Text**: #e0e0e0 (light gray)
- **Muted**: #888888
- **Accent**: #ffffff (white)

**Typography**: System fonts, uppercase titles, bold weights, tight tracking

## Key Features

1. **Marketing Generator** (`/marketing`) - AI image generation
2. **WebP Converter** (`/webp`) - PNG to WebP with variants
3. **App Store Screenshots** (`/screenshots`) - iOS device sizes (6.9", 6.7", etc.)
4. **App Icon Generator** (`/icons`) - All icon formats with ZIP download

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:8787
```

### Backend (wrangler secrets)
```
GEMINI_API_KEY - Google Gemini API key
```

## Notes

- Image processing runs client-side (Canvas API)
- ZIP downloads use jszip library
- macOS .icns requires manual `iconutil` command
- Rate limiting: 10 AI generations per day per IP
