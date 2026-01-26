---
name: gemini-image-generation
description: Generate images using Google's Gemini Imagen models. Use this skill when implementing AI image generation features with Gemini/Imagen APIs.
---

This skill guides implementation of AI image generation using Google's Gemini Imagen models. Use for creating custom image generation features, design tools, or creative applications.

## Model Selection

### Imagen 4.0 (Recommended for Production)
- **Model ID:** `imagen-4.0-generate-001`
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict`
- **Best for:** High-quality image generation, production applications
- **Features:** Superior image quality, better prompt adherence, safety filters

### Gemini 2.0 Flash (Alternative)
- **Model ID:** `gemini-2.0-flash-preview-image-generation`
- **Best for:** Quick iterations, conversational context
- **Features:** Multimodal understanding, faster response times

## API Integration Pattern

### Basic Request Structure (Imagen 4.0)

```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt: fullPrompt }],
      parameters: {
        sampleCount: 1,           // 1-4 images
        aspectRatio: "1:1",       // "1:1", "3:4", "4:3", "9:16", "16:9"
        personGeneration: "DONT_ALLOW",  // For safety
        safetyFilterLevel: "BLOCK_MEDIUM_AND_ABOVE"
      },
    }),
  }
);

const result = await response.json();
const base64Image = result.predictions[0].bytesBase64Encoded;
const imageUrl = `data:image/png;base64,${base64Image}`;
```

### Error Handling

```typescript
if (!response.ok) {
  const errorText = await response.text();
  let errorMessage = `Imagen API error: ${response.status}`;
  try {
    const errorJson = JSON.parse(errorText);
    if (errorJson.error?.message) {
      errorMessage = errorJson.error.message;
    }
  } catch (e) {
    // JSON parse failed, use status code message
  }
  throw new Error(errorMessage);
}

// Check for safety filter blocks
if (!result.predictions || result.predictions.length === 0) {
  throw new Error("No image generated - possible safety filter block");
}
```

### Common Error Codes
| Code | Meaning | User Message |
|------|---------|--------------|
| 400 | Invalid prompt | "Please try a different description" |
| 403 | API key invalid/quota exceeded | "Service temporarily unavailable" |
| 429 | Rate limited | "Too many requests, please wait" |
| 500 | Server error | "Service error, try again later" |

## Prompt Engineering Best Practices

### Prompt Structure
Build prompts with these components:
1. **Context/Scene:** What the overall image should depict
2. **Style:** Art style, aesthetic, mood
3. **Color guidance:** Primary colors, palette direction
4. **Technical specs:** Aspect ratio, composition notes
5. **Quality modifiers:** "high quality", "detailed", "vibrant"

### Example Prompt Builder

```typescript
function buildImagePrompt(
  subject: string,
  style: string,
  primaryColor: string,
  context: string
): string {
  const base = `A high-quality ${style} illustration.`;
  const colorGuide = primaryColor ? `Primary color: ${primaryColor}.` : "";
  const contextNote = context ? `Context: ${context}.` : "";

  return `${base} ${colorGuide} ${contextNote} Subject: ${subject}. Detailed, vibrant, professional quality.`;
}
```

### Negative Prompts (When Supported)
Some API versions support negative prompts to exclude unwanted elements:

```typescript
const negativePrompt = "blurry, low quality, distorted, text, watermark, logo";
```

### Style Modifiers
| Style | Prompt Addition |
|-------|-----------------|
| Cartoon | "cartoon style, bold outlines, vibrant colors" |
| Realistic | "photorealistic, detailed textures, natural lighting" |
| Abstract | "abstract art, geometric shapes, artistic interpretation" |
| Minimalist | "minimalist design, clean lines, simple composition" |
| Watercolor | "watercolor painting, soft edges, artistic brush strokes" |

## Safety & Content Filtering

### Always Include Safety Parameters
```typescript
parameters: {
  personGeneration: "DONT_ALLOW",  // Blocks human generation
  safetyFilterLevel: "BLOCK_MEDIUM_AND_ABOVE"
}
```

### Content Validation
Before sending to API, validate prompts:
```typescript
function validatePrompt(prompt: string): { valid: boolean; reason?: string } {
  const blocked = ["violence", "weapon", "nude", "explicit", /* ... */];
  const lower = prompt.toLowerCase();

  for (const word of blocked) {
    if (lower.includes(word)) {
      return { valid: false, reason: `Content not allowed: ${word}` };
    }
  }
  return { valid: true };
}
```

## Rate Limiting & Usage

### Implement Client-Side Throttling
```typescript
const RATE_LIMIT = {
  requestsPerMinute: 10,
  requestsPerDay: 100,
};

// Track usage per user session
let requestCount = 0;
let lastReset = Date.now();

function canMakeRequest(): boolean {
  const now = Date.now();
  if (now - lastReset > 60000) {
    requestCount = 0;
    lastReset = now;
  }
  return requestCount < RATE_LIMIT.requestsPerMinute;
}
```

### Show Usage Feedback
```typescript
// After successful generation
setGenerationCount(prev => prev + 1);
// Display: "AI Generated #{count}" badge on images
```

## Environment Configuration

### Required Variables
```bash
# Server-side only (never expose to client)
GEMINI_API_KEY=your_api_key_here

# Optional feature flag
NEXT_PUBLIC_ENABLE_AI_GENERATION=true
```

### Cloudflare Pages Setup
Add `GEMINI_API_KEY` to Settings > Environment Variables in Cloudflare Pages dashboard.

## UI/UX Best Practices

### Loading States
- Show clear progress indicator during generation
- Display the prompt being processed
- Estimate ~3-10 seconds for image generation

### Success Flow
1. Show generated image with "AI Generated" badge
2. Offer "Try Again" for regeneration
3. Offer "Use This" to accept the result
4. Allow prompt editing for iteration

### Error Recovery
- Show user-friendly error messages
- Offer specific suggestions based on error type
- Provide "Try Different Prompt" option
- Log errors for debugging

## Testing

### Test Prompts
```typescript
const testPrompts = [
  "A cute cartoon dog playing fetch",
  "Abstract geometric pattern in blue and gold",
  "A serene mountain landscape at sunset",
];
```

### Verify
1. API key is configured correctly
2. Response includes `predictions[0].bytesBase64Encoded`
3. Base64 converts to valid PNG image
4. Safety filters block inappropriate content
5. Rate limiting prevents abuse

## Common Patterns

### Insole Design Generation
```typescript
const insolePrompt = buildImagePrompt(
  userPrompt,
  "flat texture pattern suitable for printing",
  baseColor,
  "top-down view design for orthopedic insole, kid-friendly"
);
```

### Avatar Generation (with safety)
```typescript
// Use abstracted/cartoon style to avoid realistic humans
const avatarPrompt = `A ${style} cartoon character avatar, non-realistic, illustrated style`;
```

### Pattern/Texture Generation
```typescript
const patternPrompt = `Seamless tileable ${subject} pattern, ${style} style, ${color} palette`;
```
