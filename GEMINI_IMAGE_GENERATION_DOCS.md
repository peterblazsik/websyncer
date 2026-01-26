# Gemini Image Generation Process Documentation

This document explains how to implement image generation using Google's Gemini/Imagen API, based on a working implementation.

---

## Overview

This implementation uses:
- **Backend**: Hono (lightweight web framework) on Cloudflare Workers
- **Frontend**: React + Vite + TypeScript
- **Image Generation**: Google Generative Language API with Imagen 4.0 model

---

## Architecture

```
Frontend (React)     →     Backend (Hono/Workers)     →     Gemini/Imagen API
    ↓                              ↓                              ↓
User fills form          Constructs prompt              Generates image
Sends config             Calls Google API               Returns base64 PNG
Displays result          Returns data URI
```

---

## Backend Implementation

### API Endpoint

Create a POST endpoint that:
1. Receives configuration from frontend
2. Constructs a detailed prompt
3. Calls the Gemini/Imagen API
4. Returns the image as a data URI

### Code Example (Hono + Cloudflare Workers)

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  GEMINI_API_KEY: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors());

app.post('/api/generate', async (c) => {
  const body = await c.req.json();
  const apiKey = c.env.GEMINI_API_KEY;

  if (!apiKey) {
    return c.json({
      success: false,
      error: 'Gemini API key not configured'
    }, 500);
  }

  // Construct your prompt from the config
  const prompt = `Your detailed prompt here based on ${JSON.stringify(body)}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1'  // Options: '1:1', '16:9', '9:16', '4:3', '3:4'
          }
        })
      }
    );

    const data = await response.json();

    // Check if generation was blocked by safety filter
    if (!data.predictions || data.predictions.length === 0) {
      return c.json({
        success: false,
        error: 'Image generation blocked. Try different prompt terms.'
      }, 400);
    }

    // Extract base64 image and return as data URI
    const base64Image = data.predictions[0].bytesBase64Encoded;
    const imageUrl = `data:image/png;base64,${base64Image}`;

    return c.json({
      success: true,
      imageUrl,
      prompt  // Optional: return prompt for debugging
    });

  } catch (error) {
    return c.json({
      success: false,
      error: `API error: ${error.message}`
    }, 500);
  }
});

export default app;
```

### Backend Dependencies

```json
{
  "dependencies": {
    "hono": "^3.12.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240101.0",
    "typescript": "^5.3.3",
    "wrangler": "^3.22.0"
  }
}
```

### Wrangler Configuration (wrangler.toml)

```toml
name = "your-backend-name"
main = "src/index.ts"
compatibility_date = "2024-01-01"
```

### Setting the API Key

```bash
# Store API key as a secret (not in wrangler.toml!)
wrangler secret put GEMINI_API_KEY
```

---

## Frontend Implementation

### Calling the API

```typescript
const handleGenerate = async () => {
  setLoading(true);

  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';

    const response = await fetch(`${apiUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)  // Your configuration object
    });

    const data = await response.json();

    if (data.success) {
      setImageUrl(data.imageUrl);  // This is a data URI
    } else {
      alert(`Generation failed: ${data.error}`);
    }
  } catch (error) {
    alert(`Error: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
```

### Displaying the Image

```tsx
{imageUrl && (
  <img
    src={imageUrl}  // Data URI works directly in src
    alt="Generated image"
    className="max-w-full"
  />
)}
```

### Downloading the Image

```typescript
const handleDownload = () => {
  if (!imageUrl) return;

  // Convert data URI to blob for download
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = `generated-image-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
```

### Frontend Environment Variables

Create `.env.production`:
```
VITE_API_URL=https://your-backend.workers.dev
```

---

## Gemini/Imagen API Details

### Endpoint
```
POST https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key={API_KEY}
```

### Request Body
```json
{
  "instances": [
    {
      "prompt": "Your detailed image description"
    }
  ],
  "parameters": {
    "sampleCount": 1,
    "aspectRatio": "1:1"
  }
}
```

### Response Format
```json
{
  "predictions": [
    {
      "bytesBase64Encoded": "iVBORw0KGgoAAAANSUhEUgAA..."
    }
  ]
}
```

### Available Aspect Ratios
- `"1:1"` - Square (1024x1024)
- `"16:9"` - Landscape widescreen
- `"9:16"` - Portrait (stories/reels)
- `"4:3"` - Standard landscape
- `"3:4"` - Standard portrait

### Sample Count
- `sampleCount: 1` to `4` - Number of images to generate per request

---

## Prompt Engineering Tips

For best results with Imagen:

1. **Be specific and detailed** - Describe the scene, lighting, style, colors
2. **Specify the format** - "1080x1080 square format", "Instagram-ready"
3. **Describe the style** - "Professional photography", "minimalist design"
4. **Include lighting details** - "Bright natural lighting", "studio lighting"
5. **Mention composition** - "centered", "rule of thirds", "close-up"

### Example Prompt Structure
```
[Style description] - [Subject details].

Scene: [Main subject] with [attributes], [action/pose].
Background: [Background description with colors].
Mood: [Emotional tone].

Style: [Photography/illustration style], [lighting], [format].
Additional elements: [Any text, logos, or overlays needed].
```

---

## Error Handling

### Safety Filter
If the API returns an empty `predictions` array, the content was blocked by safety filters. Handle this:

```typescript
if (!data.predictions || data.predictions.length === 0) {
  return c.json({
    success: false,
    error: 'Image generation blocked by safety filter. Try more generic terms.'
  }, 400);
}
```

### Common Issues
- **Missing API key**: Check environment variables
- **Invalid prompt**: Some terms trigger safety filters
- **Rate limiting**: Implement retry logic with exponential backoff
- **Network errors**: Wrap in try-catch with user-friendly messages

---

## Setup Checklist

1. **Google Cloud Console**
   - Create a project
   - Enable "Generative Language API"
   - Create an API key

2. **Backend**
   - Install dependencies: `npm install hono`
   - Set API key: `wrangler secret put GEMINI_API_KEY`
   - Deploy: `wrangler deploy`

3. **Frontend**
   - Set `VITE_API_URL` in environment
   - Build: `npm run build`
   - Deploy to hosting (Cloudflare Pages, Vercel, etc.)

---

## Quick Start Commands

```bash
# Backend development
cd backend
npm install
wrangler dev  # Runs on http://localhost:8787

# Frontend development
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173

# Production deployment
cd backend && wrangler deploy
cd frontend && npm run build
```

---

## Key Takeaways

1. **Use data URIs** - The API returns base64, convert to `data:image/png;base64,{base64}` for direct use in `<img src>`
2. **Handle safety filters** - Empty predictions array means content was blocked
3. **Store API key securely** - Use Cloudflare secrets, not in code
4. **Enable CORS** - Backend needs CORS for cross-origin requests from frontend
5. **Detailed prompts work best** - More specific = better results
