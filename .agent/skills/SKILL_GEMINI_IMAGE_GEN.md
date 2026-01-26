---
description: Guide for implementing Gemini Image Generation (Imagen) with Cloudflare Workers and Hono
---

# Gemini Image Generation Skill (Imagen on Cloudflare)

This skill provides a step-by-step best practice guide for implementing image generation using Google's **Imagen** models (often accessed via the Gemini API ecosystem). 

> **Note**: While the user might refer to "Nano" or "Banana", the correct model family for *image generation* is **Imagen** (e.g., `imagen-3.0-generate-001`). "Gemini Nano" is strictly for text/multimodal tasks on-device.

## 1. Prerequisites & Setup

### API Keys
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Create a new API Key.
3. Enable the **Generative Language API** in your Google Cloud project if not already active.

### Tech Stack
- **Backend**: Cloudflare Workers + Hono (lightweight, edge-ready).
- **Frontend**: React (Vite) + TypeScript.

## 2. Backend Implementation (Cloudflare Workers)

We use **Hono** to handle requests because it simplifies routing and CORS on Cloudflare Workers.

### Step 2.1: Dependencies
Inside your `backend` directory:
```bash
npm install hono
npm install -D @cloudflare/workers-types wrangler
```

### Step 2.2: Wrangler Config (`wrangler.toml`)
Ensure your `compatibility_date` is recent.
```toml
name = "your-backend-name"
main = "src/index.ts"
compatibility_date = "2024-04-01"

# Do NOT put the API key here directly. Use secrets.
```

### Step 2.3: Set API Key Secret
Run this in your terminal:
```bash
npx wrangler secret put GEMINI_API_KEY
# Paste your key when prompted
```

### Step 2.4: Code (`src/index.ts`)
This is the robust implementation pattern.

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  GEMINI_API_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

// 1. Enable CORS for frontend access
app.use('/*', cors())

app.post('/api/generate', async (c) => {
  try {
    const body = await c.req.json();
    const apiKey = c.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing in secrets.");
    }

    // 2. Construct the Prompt
    // Be descriptive. Imagen thrives on details like lighting, style, and mood.
    const prompt = body.prompt || "A futuristic city with flying cars, cinematic lighting, 8k resolution";

    // 3. Call the API (REST)
    // Model ID: Check Google AI Studio for the latest. `imagen-3.0-generate-001` is standard.
    // If you have access to `imagen-4.0-generate-001`, use that.
    const MODEL_ID = 'imagen-3.0-generate-001'; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:predict?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1" // Options: "1:1", "16:9", "9:16", "3:4", "4:3"
        }
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API Error (${response.status}): ${errText}`);
    }

    const data = await response.json() as any;

    // 4. Handle Response & Safety
    // If 'predictions' is empty, it means the Safety Filter blocked the request.
    if (!data.predictions || data.predictions.length === 0) {
        return c.json({
            success: false, 
            error: "Safety Filter triggered. Try a less controversial prompt."
        }, 400);
    }

    const base64Image = data.predictions[0].bytesBase64Encoded;
    const imageUrl = `data:image/png;base64,${base64Image}`;

    return c.json({ success: true, imageUrl });

  } catch (error: any) {
    console.error(error);
    return c.json({ success: false, error: error.message }, 500);
  }
})

export default app
```

## 3. Frontend Implementation (React)

### Step 3.1: Fetching
Use `fetch` to call your Cloudflare Worker.

```typescript
const generateImage = async (prompt: string) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    
    const data = await res.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }
    
    return data.imageUrl; // Returns "data:image/png;base64,..."
  } catch (err) {
    console.error("Generation failed", err);
  }
};
```

### Step 3.2: Displaying
Directly use the returned data URI in the `src` attribute.

```tsx
<img src={imageUrl} alt="Generated result" />
```

## 4. Common Pitfalls & Best Practices

1.  **Safety Filters**: The API returns an empty prediction list (or sometimes a structured error) if the prompt violates safety policies (violence, hatred, sexual content). **Always** check for `!data.predictions` before accessing `data.predictions[0]`.
2.  **Rate Limits**: The free tier has limits. Handle HTTP 429 explicitly if possible.
3.  **Model Availability**: If `imagen-3.0-generate-001` returns 404, check your API key permissions or try `imagen-2`.
4.  **Prompt Engineering**:
    *   **Do**: "Photorealistic, cinematic lighting, 35mm lens, 8k"
    *   **Don't**: "A picture of a cat" (Too vague)
5.  **Environment Variables**:
    *   **Backend**: Use `wrangler secret put` (production) and `.dev.vars` (local dev).
    *   **Frontend**: Use `VITE_API_URL` to point to localhost in dev and the workers.dev URL in prod.

## 5. Debugging Checklist
- [ ] Is the API Key correct and enabled for "Generative Language API"?
- [ ] Is `wrangler.toml` pointing to the right entry point?
- [ ] Are there CORS errors? (Check `app.use('/*', cors())` in backend).
- [ ] Is the safety filter blocking your test prompt? (Try "A cute robot eating an apple").
