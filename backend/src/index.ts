import { Hono } from "hono";
import { cors } from "hono/cors";

type Bindings = {
  GEMINI_API_KEY: string;
  RATE_LIMIT: KVNamespace;
  WHITELIST_IPS?: string;
};

// Rate limit configuration
const RATE_LIMITS = {
  SHORT_TERM: {
    MAX_REQUESTS: 10,
    WINDOW_MINUTES: 10,
    TTL: 660, // 11 minutes (buffer for edge cases)
  },
  DAILY: {
    MAX_REQUESTS: 70,
    TTL: 86400, // 24 hours
  },
};

// Whitelisted IPs with higher limits - loaded from environment variable
// Set WHITELIST_IPS in wrangler.toml or .dev.vars as comma-separated values
// e.g., WHITELIST_IPS=<ipv4>,<ipv6>
function getWhitelistIPs(env: { WHITELIST_IPS?: string }): string[] {
  if (!env.WHITELIST_IPS) return [];
  return env.WHITELIST_IPS.split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);
}

const WHITELIST_LIMITS = {
  SHORT_TERM: {
    MAX_REQUESTS: 30,
    WINDOW_MINUTES: 10,
    TTL: 660,
  },
  DAILY: {
    MAX_REQUESTS: 200,
    TTL: 86400,
  },
};

/**
 * Get rate limits based on IP whitelist status
 */
function getRateLimits(ip: string, env: { WHITELIST_IPS?: string }) {
  const whitelistIPs = getWhitelistIPs(env);
  if (whitelistIPs.includes(ip)) {
    return WHITELIST_LIMITS;
  }
  return RATE_LIMITS;
}

/**
 * Creates IP-based fingerprint for rate limiting.
 * Uses IP only — other headers are trivially spoofable.
 */
async function createFingerprint(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex.slice(0, 16);
}

/**
 * Gets the current 10-minute time bucket.
 * Format: YYYY-MM-DD-HH-MM where MM is rounded to nearest 10.
 */
function getShortTermBucket(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const hour = String(now.getUTCHours()).padStart(2, "0");
  const tenMinute = Math.floor(now.getUTCMinutes() / 10) * 10;
  const tenMinuteStr = String(tenMinute).padStart(2, "0");
  return `${year}-${month}-${day}-${hour}-${tenMinuteStr}`;
}

/**
 * Gets today's date in YYYY-MM-DD format for daily limits.
 */
function getDailyBucket(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Extract client IP from Cloudflare headers.
 * CF-Connecting-IP is always set by Cloudflare and cannot be spoofed.
 * Returns null if no trustworthy IP is available.
 */
function getClientIp(c: {
  req: { header: (name: string) => string | undefined };
}): string | null {
  return c.req.header("CF-Connecting-IP") || null;
}

/**
 * Max allowed request body size in characters (approx bytes for ASCII/UTF-8)
 */
const MAX_BODY_SIZE = 50_000; // 50KB

/**
 * Max prompt length for any endpoint
 */
const MAX_PROMPT_LENGTH = 10_000;

/**
 * Allowed product types for classification and zone suggestion endpoints.
 * Prevents prompt injection via arbitrary productType values.
 */
const VALID_PRODUCT_TYPES = [
  "sock",
  "insole",
  "shoe",
  "tshirt",
  "bottle",
  "unknown",
];

/**
 * Wraps fetch with an AbortController timeout to prevent hanging on unresponsive upstream APIs.
 */
function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 15000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timeout),
  );
}

/**
 * Rate limit check + increment. Awaits counter writes to prevent race conditions.
 * Returns null if allowed, or an error response if rate limited.
 */
async function checkAndIncrementRateLimit(
  ip: string,
  env: Bindings,
): Promise<
  | { error: true; response: Response }
  | {
      error: false;
      limits: typeof RATE_LIMITS;
      currentShortTerm: number;
      currentDaily: number;
    }
> {
  const fingerprint = await createFingerprint(ip);
  const limits = getRateLimits(ip, env);

  const shortTermBucket = getShortTermBucket();
  const dailyBucket = getDailyBucket();

  const shortTermKey = `rl:short:${fingerprint}:${shortTermBucket}`;
  const dailyKey = `rl:daily:${fingerprint}:${dailyBucket}`;

  // Check both rate limits in parallel
  const [shortTermCount, dailyCount] = await Promise.all([
    env.RATE_LIMIT.get(shortTermKey),
    env.RATE_LIMIT.get(dailyKey),
  ]);

  const currentShortTerm = shortTermCount ? parseInt(shortTermCount) : 0;
  const currentDaily = dailyCount ? parseInt(dailyCount) : 0;

  // Check short-term limit
  if (currentShortTerm >= limits.SHORT_TERM.MAX_REQUESTS) {
    const minutesIntoWindow = new Date().getUTCMinutes() % 10;
    const secondsIntoWindow = new Date().getUTCSeconds();
    const retryAfter = (10 - minutesIntoWindow) * 60 - secondsIntoWindow;

    return {
      error: true,
      response: new Response(
        JSON.stringify({
          success: false,
          error: `Too many requests. You can generate up to ${limits.SHORT_TERM.MAX_REQUESTS} images per ${limits.SHORT_TERM.WINDOW_MINUTES} minutes. Please wait a few minutes.`,
          retryAfter: Math.max(retryAfter, 60),
          limitType: "short_term",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      ),
    };
  }

  // Check daily limit
  if (currentDaily >= limits.DAILY.MAX_REQUESTS) {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setUTCHours(24, 0, 0, 0);
    const retryAfter = Math.floor((endOfDay.getTime() - now.getTime()) / 1000);

    return {
      error: true,
      response: new Response(
        JSON.stringify({
          success: false,
          error: `Daily limit reached. You can generate up to ${limits.DAILY.MAX_REQUESTS} images per day. Try again tomorrow!`,
          retryAfter,
          limitType: "daily",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      ),
    };
  }

  // Increment counters — await to prevent race condition
  await Promise.all([
    env.RATE_LIMIT.put(shortTermKey, (currentShortTerm + 1).toString(), {
      expirationTtl: limits.SHORT_TERM.TTL,
    }),
    env.RATE_LIMIT.put(dailyKey, (currentDaily + 1).toString(), {
      expirationTtl: limits.DAILY.TTL,
    }),
  ]);

  return { error: false, limits, currentShortTerm, currentDaily };
}

const app = new Hono<{ Bindings: Bindings }>();

// Restrict CORS to actual origins
app.use(
  "/*",
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://websyncer.pages.dev",
    ],
  }),
);

// Rate limit status endpoint - check limits without consuming a request
app.get("/api/rate-limit-status", async (c) => {
  const ip = getClientIp(c);
  if (!ip) {
    return c.json({ error: "Unable to identify client" }, 400);
  }

  const fingerprint = await createFingerprint(ip);
  const limits = getRateLimits(ip, c.env);

  const shortTermBucket = getShortTermBucket();
  const dailyBucket = getDailyBucket();

  const [shortTermCount, dailyCount] = await Promise.all([
    c.env.RATE_LIMIT.get(`rl:short:${fingerprint}:${shortTermBucket}`),
    c.env.RATE_LIMIT.get(`rl:daily:${fingerprint}:${dailyBucket}`),
  ]);

  return c.json({
    shortTerm: {
      used: shortTermCount ? parseInt(shortTermCount) : 0,
      limit: limits.SHORT_TERM.MAX_REQUESTS,
      windowMinutes: limits.SHORT_TERM.WINDOW_MINUTES,
    },
    daily: {
      used: dailyCount ? parseInt(dailyCount) : 0,
      limit: limits.DAILY.MAX_REQUESTS,
    },
  });
});

app.post("/api/generate", async (c) => {
  try {
    const ip = getClientIp(c);
    if (!ip) {
      return c.json(
        { success: false, error: "Unable to identify client" },
        400,
      );
    }

    // Rate limit check
    const rateCheck = await checkAndIncrementRateLimit(ip, c.env);
    if (rateCheck.error) return rateCheck.response;
    const { limits, currentShortTerm, currentDaily } = rateCheck;

    // Body size check — read raw text to validate actual size, not the spoofable Content-Length header
    const rawBody = await c.req.text();
    if (rawBody.length > MAX_BODY_SIZE) {
      return c.json({ success: false, error: "Request body too large" }, 413);
    }
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return c.json({ success: false, error: "Invalid JSON" }, 400);
    }
    const { person, foreground, background, branding } = body;

    // Input validation
    if (!person || !foreground || !background || !branding) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    // Validate string field lengths
    const allFields = [
      person.mainCharacter,
      person.clothingColor,
      person.action,
      foreground.customText,
      foreground.color,
      foreground.imageType,
      foreground.measurement,
      background.sloganLocation,
      background.sloganLanguage,
      background.wallText,
      background.mood,
      background.motivationalText,
      background.sloganProduct,
      branding.logoText,
      branding.logoTextColor,
      branding.logoBgColor,
      branding.logoBorderColor,
      branding.instagramContact,
    ];
    for (const field of allFields) {
      if (typeof field === "string" && field.length > 500) {
        return c.json(
          { success: false, error: "Field value too long (max 500 chars)" },
          400,
        );
      }
    }

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
      return c.json({ success: false, error: "API configuration error" }, 500);
    }

    // Calling Imagen 4.0 via Generative Language API (using header auth)
    const response = await fetchWithTimeout(
      "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: prompt,
            },
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: "1:1",
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = (await response.json()) as any;

    // Response format: { predictions: [ { bytesBase64Encoded: "..." } ] }
    if (
      data.predictions &&
      data.predictions.length > 0 &&
      data.predictions[0].bytesBase64Encoded
    ) {
      const base64Image = data.predictions[0].bytesBase64Encoded;
      const imageUrl = `data:image/png;base64,${base64Image}`;
      return c.json({
        success: true,
        prompt: prompt,
        imageUrl: imageUrl,
        rateLimit: {
          shortTermRemaining:
            limits.SHORT_TERM.MAX_REQUESTS - currentShortTerm - 1,
          dailyRemaining: limits.DAILY.MAX_REQUESTS - currentDaily - 1,
        },
      });
    }

    console.error("Unexpected response format:", data);

    if (Object.keys(data).length === 0) {
      throw new Error(
        "Generation blocked. The prompt triggered a safety filter (likely due to Age/Action combination). Try 'Young Athlete' instead of specific ages.",
      );
    }

    throw new Error("No image data returned from API");
  } catch (error: any) {
    console.error("Generation failed:", error);
    const message =
      error?.message?.includes("safety filter") ||
      error?.message?.includes("Generation blocked")
        ? error.message
        : "Failed to generate image. Please try again.";
    return c.json(
      {
        success: false,
        error: message,
      },
      500,
    );
  }
});

// Branding generation endpoint - uses pre-configured prompts from frontend
app.post("/api/branding/generate", async (c) => {
  try {
    const ip = getClientIp(c);
    if (!ip) {
      return c.json(
        { success: false, error: "Unable to identify client" },
        400,
      );
    }

    // Rate limit check
    const rateCheck = await checkAndIncrementRateLimit(ip, c.env);
    if (rateCheck.error) return rateCheck.response;
    const { limits, currentShortTerm, currentDaily } = rateCheck;

    // Body size check — validate actual body size
    const rawBody = await c.req.text();
    if (rawBody.length > MAX_BODY_SIZE) {
      return c.json({ success: false, error: "Request body too large" }, 413);
    }
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return c.json({ success: false, error: "Invalid JSON" }, 400);
    }
    const { prompt, aspectRatio } = body;

    if (!prompt || typeof prompt !== "string") {
      return c.json({ success: false, error: "Prompt is required" }, 400);
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return c.json(
        {
          success: false,
          error: `Prompt too long (max ${MAX_PROMPT_LENGTH} chars)`,
        },
        400,
      );
    }

    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey) {
      return c.json({ success: false, error: "API configuration error" }, 500);
    }

    // Imagen 4.0 only supports these aspect ratios: 1:1, 3:4, 4:3, 9:16, 16:9
    const supportedRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
    const apiAspectRatio = supportedRatios.includes(aspectRatio)
      ? aspectRatio
      : "1:1";

    const requestParams = {
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: apiAspectRatio,
      },
    };

    // Calling Imagen 4.0 via Generative Language API (using header auth)
    const response = await fetchWithTimeout(
      "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(requestParams),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      throw new Error(`Image generation failed: ${response.status}`);
    }

    const data = (await response.json()) as any;

    if (
      data.predictions &&
      data.predictions.length > 0 &&
      data.predictions[0].bytesBase64Encoded
    ) {
      const base64Image = data.predictions[0].bytesBase64Encoded;
      const imageUrl = `data:image/png;base64,${base64Image}`;
      return c.json({
        success: true,
        imageUrl: imageUrl,
        rateLimit: {
          shortTermRemaining:
            limits.SHORT_TERM.MAX_REQUESTS - currentShortTerm - 1,
          dailyRemaining: limits.DAILY.MAX_REQUESTS - currentDaily - 1,
        },
      });
    }

    console.error("Unexpected response format:", data);

    if (Object.keys(data).length === 0) {
      throw new Error(
        "Generation blocked by safety filter. Try modifying the prompt.",
      );
    }

    throw new Error("No image data returned from API");
  } catch (error: any) {
    console.error("Branding generation failed:", error);
    const message =
      error?.message?.includes("safety filter") ||
      error?.message?.includes("Generation blocked")
        ? error.message
        : "Failed to generate image. Please try again.";
    return c.json(
      {
        success: false,
        error: message,
      },
      500,
    );
  }
});

// Batch generation endpoint - uses Gemini 3 Pro for flexible image generation
app.post("/api/batch/generate", async (c) => {
  try {
    const ip = getClientIp(c);
    if (!ip) {
      return c.json(
        { success: false, error: "Unable to identify client" },
        400,
      );
    }

    // Rate limit check
    const rateCheck = await checkAndIncrementRateLimit(ip, c.env);
    if (rateCheck.error) return rateCheck.response;
    const { limits, currentShortTerm, currentDaily } = rateCheck;

    // Body size check — validate actual body size
    const rawBody = await c.req.text();
    if (rawBody.length > MAX_BODY_SIZE) {
      return c.json({ success: false, error: "Request body too large" }, 413);
    }
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return c.json({ success: false, error: "Invalid JSON" }, 400);
    }
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return c.json(
        { success: false, error: "Prompt must be a non-empty string" },
        400,
      );
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
      return c.json(
        {
          success: false,
          error: `Prompt is too long (max ${MAX_PROMPT_LENGTH} characters)`,
        },
        400,
      );
    }

    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey) {
      return c.json({ success: false, error: "API configuration error" }, 500);
    }

    // Call Gemini 3 Pro Image model via generateContent endpoint
    const response = await fetchWithTimeout(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Gemini 3 Pro API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch {
        // JSON parse failed, use generic message
      }
      console.error("Gemini 3 Pro API error:", errorMessage);
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as any;

    // Extract image from Gemini 3 Pro response
    const candidates = data.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No response from Gemini 3 Pro");
    }

    const parts = candidates[0]?.content?.parts;
    if (!parts || parts.length === 0) {
      const blockReason = candidates[0]?.finishReason;
      if (blockReason === "SAFETY") {
        return c.json(
          {
            success: false,
            error:
              "This image couldn't be generated due to content restrictions. Please try a different prompt.",
          },
          400,
        );
      }
      throw new Error("No content in Gemini 3 Pro response");
    }

    // Find the image part (inlineData with mimeType starting with "image/")
    const imagePart = parts.find(
      (part: { inlineData?: { mimeType?: string; data?: string } }) =>
        part.inlineData?.mimeType?.startsWith("image/"),
    );

    if (!imagePart?.inlineData?.data) {
      const blockReason = candidates[0]?.finishReason;
      if (blockReason === "SAFETY") {
        return c.json(
          {
            success: false,
            error:
              "This image couldn't be generated due to content restrictions. Please try a different prompt.",
          },
          400,
        );
      }
      throw new Error("No image generated by Gemini 3 Pro");
    }

    const mimeType = imagePart.inlineData.mimeType;
    const base64Image = imagePart.inlineData.data;
    const imageUrl = `data:${mimeType};base64,${base64Image}`;

    return c.json({
      success: true,
      imageUrl: imageUrl,
      mimeType: mimeType,
      rateLimit: {
        shortTermRemaining:
          limits.SHORT_TERM.MAX_REQUESTS - currentShortTerm - 1,
        dailyRemaining: limits.DAILY.MAX_REQUESTS - currentDaily - 1,
      },
    });
  } catch (error: any) {
    console.error("Batch generation failed:", error);
    return c.json(
      {
        success: false,
        error: "Failed to generate image. Please try again.",
      },
      500,
    );
  }
});

// ─── Product Classification ───────────────────────────────────────

/**
 * Max allowed image payload size for classification (5MB base64)
 */
const MAX_CLASSIFY_BODY_SIZE = 7_000_000;

/**
 * Extract mime type and raw base64 data from a data URL or raw base64 string.
 */
function parseBase64Image(input: string): { mimeType: string; data: string } {
  const match = input.match(/^data:([^;]+);base64,(.+)$/);
  if (match) return { mimeType: match[1], data: match[2] };
  // Assume raw base64 PNG if no data URL prefix
  return { mimeType: "image/png", data: input };
}

app.post("/api/classify-product", async (c) => {
  try {
    const ip = getClientIp(c);
    if (!ip) {
      return c.json(
        { success: false, error: "Unable to identify client" },
        400,
      );
    }

    // Rate limit check
    const rateCheck = await checkAndIncrementRateLimit(ip, c.env);
    if (rateCheck.error) return rateCheck.response;

    // Body size check — validate actual body size
    const rawBody = await c.req.text();
    if (rawBody.length > MAX_CLASSIFY_BODY_SIZE) {
      return c.json({ success: false, error: "Request body too large" }, 413);
    }
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return c.json({ success: false, error: "Invalid JSON" }, 400);
    }
    const { image, viewBox } = body as {
      image?: string;
      viewBox?: { width: number; height: number };
    };

    if (!image || typeof image !== "string") {
      return c.json(
        {
          success: false,
          error: "Missing required field: image (base64 string)",
        },
        400,
      );
    }

    // Validate viewBox dimensions if provided to prevent abuse
    if (viewBox) {
      if (
        typeof viewBox.width !== "number" ||
        typeof viewBox.height !== "number" ||
        !isFinite(viewBox.width) ||
        !isFinite(viewBox.height) ||
        viewBox.width <= 0 ||
        viewBox.height <= 0 ||
        viewBox.width > 10000 ||
        viewBox.height > 10000
      ) {
        return c.json(
          { success: false, error: "Invalid viewBox dimensions" },
          400,
        );
      }
    }

    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey) {
      return c.json({ success: false, error: "API configuration error" }, 500);
    }

    const { mimeType, data } = parseBase64Image(image);

    // Build the classification prompt — viewBox dimensions enable zone suggestions
    let prompt = `You are a product recognition system for a manufacturing SVG template generator.

Analyze this product photo and return a JSON object with:
1. "productType": one of "sock", "insole", "shoe", "tshirt", "bottle", or "unknown"
2. "confidence": number between 0 and 1`;

    if (viewBox) {
      prompt += `

If viewBox dimensions are provided (width: ${viewBox.width}, height: ${viewBox.height}), also suggest zone cut positions:
3. "suggestedCuts": array of { "axis": "horizontal"|"vertical", "position": number, "label": string }
4. "suggestedZones": array of { "id": string, "label": string, "yMin": number, "yMax": number, "xMin": number, "xMax": number }

The cuts should be placed at natural transition points of the product's anatomy.
For socks: calf/ankle/heel/foot/toe boundaries
For shoes: toe box/vamp/quarter/heel counter/sole boundaries
For insoles: toe/ball/arch/heel boundaries
For t-shirts: collar/chest/sleeves/body boundaries
For bottles: cap/neck/label/body/base boundaries`;
    }

    prompt += `

Return ONLY valid JSON, no markdown formatting, no code blocks.`;

    const geminiResponse = await fetchWithTimeout(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }, { inlineData: { mimeType, data } }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini classification error:", errorText);
      return c.json(
        {
          success: false,
          error: `Classification failed: ${geminiResponse.status}`,
        },
        502,
      );
    }

    const geminiData = (await geminiResponse.json()) as any;

    // Extract text response from Gemini candidates
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let classification: {
      productType: string;
      confidence: number;
      suggestedCuts?: any[];
      suggestedZones?: any[];
    };

    try {
      // Strip potential markdown code fences that models sometimes return despite instructions
      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      classification = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Gemini classification JSON:", rawText);
      classification = { productType: "unknown", confidence: 0 };
    }

    return c.json({
      success: true,
      productType: classification.productType,
      confidence: classification.confidence,
      suggestedCuts: classification.suggestedCuts,
      suggestedZones: classification.suggestedZones,
    });
  } catch (error: any) {
    console.error("Classification failed:", error);
    return c.json(
      {
        success: false,
        error: "Classification failed. Please try again.",
      },
      500,
    );
  }
});

// ─── Zone Suggestion from Cleaned Outline ─────────────────────────

app.post("/api/suggest-zones", async (c) => {
  try {
    const ip = getClientIp(c);
    if (!ip) {
      return c.json(
        { success: false, error: "Unable to identify client" },
        400,
      );
    }

    // Rate limit check
    const rateCheck = await checkAndIncrementRateLimit(ip, c.env);
    if (rateCheck.error) return rateCheck.response;

    // Body size check — validate actual body size
    const rawBody = await c.req.text();
    if (rawBody.length > MAX_CLASSIFY_BODY_SIZE) {
      return c.json({ success: false, error: "Request body too large" }, 413);
    }
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return c.json({ success: false, error: "Invalid JSON" }, 400);
    }
    const { image, productType, viewBox } = body as {
      image?: string;
      productType?: string;
      viewBox?: { width: number; height: number };
    };

    if (!image || typeof image !== "string") {
      return c.json(
        { success: false, error: "Missing required field: image (base64 PNG)" },
        400,
      );
    }
    if (!productType || typeof productType !== "string") {
      return c.json(
        { success: false, error: "Missing required field: productType" },
        400,
      );
    }
    // Validate productType against allowlist to prevent prompt injection
    if (!VALID_PRODUCT_TYPES.includes(productType)) {
      return c.json({ success: false, error: "Invalid product type" }, 400);
    }
    if (
      !viewBox ||
      typeof viewBox.width !== "number" ||
      typeof viewBox.height !== "number"
    ) {
      return c.json(
        {
          success: false,
          error: "Missing required field: viewBox ({ width, height })",
        },
        400,
      );
    }

    const apiKey = c.env.GEMINI_API_KEY;
    if (!apiKey) {
      return c.json({ success: false, error: "API configuration error" }, 500);
    }

    const { mimeType, data } = parseBase64Image(image);

    const prompt = `You are a product zone positioning system for a manufacturing SVG template generator.

You are looking at a cleaned SVG outline of a "${productType}" product rendered as an image.
The viewBox is ${viewBox.width}x${viewBox.height}.

Based on the actual shape of the outline, suggest optimal cut line positions to divide this product into its natural anatomical zones.

For a sock: calf (top), ankle band, heel, foot, toe (bottom)
For an insole: toe (top), ball, arch, heel (bottom)
For a shoe: toe box (top), vamp, quarter, heel counter, sole (bottom)
For a t-shirt: collar (top), chest/sleeves (middle), body (bottom)
For a bottle: cap (top), neck, label, body, base (bottom)

Place cuts where the shape naturally transitions — where it narrows, widens, or changes curvature.

Return ONLY valid JSON with:
{
  "suggestedCuts": [
    { "axis": "horizontal" or "vertical", "position": <number within viewBox>, "label": "<boundary name>" }
  ],
  "suggestedZones": [
    { "id": "<zone_id>", "label": "<Zone Label>", "yMin": <number>, "yMax": <number>, "xMin": 0, "xMax": ${viewBox.width} }
  ]
}`;

    const geminiResponse = await fetchWithTimeout(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }, { inlineData: { mimeType, data } }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1024,
          },
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini zone suggestion error:", errorText);
      return c.json(
        {
          success: false,
          error: `Zone suggestion failed: ${geminiResponse.status}`,
        },
        502,
      );
    }

    const geminiData = (await geminiResponse.json()) as any;
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let parsed: {
      suggestedCuts?: any[];
      suggestedZones?: any[];
    };

    try {
      const cleaned = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Gemini zone suggestion JSON:", rawText);
      return c.json(
        { success: false, error: "Failed to parse AI response" },
        502,
      );
    }

    return c.json({
      success: true,
      suggestedCuts: parsed.suggestedCuts ?? [],
      suggestedZones: parsed.suggestedZones ?? [],
    });
  } catch (error: any) {
    console.error("Zone suggestion failed:", error);
    return c.json(
      {
        success: false,
        error: "Zone suggestion failed. Please try again.",
      },
      500,
    );
  }
});

app.get("/", (c) => {
  return c.text("WebSyncer API is running!");
});

export default app;
