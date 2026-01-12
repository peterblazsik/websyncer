import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
    GEMINI_API_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/*', cors())

app.post('/api/generate', async (c) => {
    try {
        const body = await c.req.json();
        const { person, foreground, background, branding } = body;

        /* 
    Prompt Engineering for "OrthoScan Growth Insoles":
    - Focus: Custom 3D-printed orthopedic INSOLES (not just the shoe).
    - Subject: "Main Character" (flexible input).
    - Branding: Logo + Instagram Contact.
  */
        const prompt = `
Ultra Professional fitness shoe INSOLE photography - hyper personalised custom orthopedic inserts.

Scene: ${person.mainCharacter} wearing ${person.clothingColor}, ${person.action}. in the foreground an emphasized personalised INSOLE (${foreground.customText}, ${foreground.color}, image - for instance ${foreground.imageType} or other masculine image on it on it and measurement based on ${foreground.measurement}) . Modern, clean fitness studio background with Skyblue,

Black: #000000 (background)
White: #FFFFFF (text) brand accents.

Text on ${background.sloganLocation} in ${background.sloganLanguage} emphasizing ${background.wallText}

Mood: ${background.mood}

text - short ${background.sloganLanguage} language motivational, encouraging to try ${background.motivationalText} and ${background.sloganProduct}

Style: High-quality lifestyle fitness photography, bright natural lighting, 1080x1080 square format for Instagram. Premium fitness brand aesthetic. 
- Bottom left corner: "${branding.logoText}" (in one line the text, ${branding.logoTextColor} bold text on ${branding.logoBgColor} rounded rectangle with ${branding.logoBorderColor} border, font type Arial Black – heavy weight, all caps).
- Contact Info: "Instagram: ${branding.instagramContact}" visible in a stylish small font.
  `.trim();

        const apiKey = c.env.GEMINI_API_KEY;
        if (!apiKey) {
            return c.json({ success: false, error: 'API Key not configured in .dev.vars' }, 500);
        }

        // Calling Imagen 4.0 via Generative Language API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                instances: [
                    {
                        prompt: prompt,
                    }
                ],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: "1:1"
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini API Error:", errorText);
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json() as any;

        // Response format: { predictions: [ { bytesBase64Encoded: "..." } ] }
        if (data.predictions && data.predictions.length > 0 && data.predictions[0].bytesBase64Encoded) {
            const base64Image = data.predictions[0].bytesBase64Encoded;
            const imageUrl = `data:image/png;base64,${base64Image}`;
            return c.json({
                success: true,
                prompt: prompt,
                imageUrl: imageUrl
            });
        }

        console.error("Unexpected response format:", data);

        if (Object.keys(data).length === 0) {
            throw new Error("Generation blocked. The prompt triggered a safety filter (likely due to Age/Action combination). Try 'Young Athlete' instead of specific ages.");
        }

        throw new Error("No image data returned from API");

    } catch (error: any) {
        console.error("Generation failed:", error);
        return c.json({
            success: false,
            prompt: "Check logs",
            error: error.message || "Failed to generate image"
        }, 500);
    }
})

app.get('/', (c) => {
    return c.text('OrthoScan API is running!')
})

export default app
