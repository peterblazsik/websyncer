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
    MAX_REQUESTS: 50,
    TTL: 86400, // 24 hours
  },
};

// Whitelisted IPs with higher limits - loaded from environment variable
// Set WHITELIST_IPS in wrangler.toml or .dev.vars as comma-separated values
// e.g., WHITELIST_IPS=24.132.177.218,2001:1c08:70e:bb00:ad06:f5c5:ab2e:6dda
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
 * Check if IP is whitelisted
 */
function isWhitelisted(ip: string, env: { WHITELIST_IPS?: string }): boolean {
  return getWhitelistIPs(env).includes(ip);
}

/**
 * Creates a composite fingerprint from request headers.
 * Combines multiple signals to make bypass harder than IP-only.
 */
async function createFingerprint(
  ip: string,
  userAgent: string,
  acceptLanguage: string,
  acceptEncoding: string,
): Promise<string> {
  const data = `${ip}|${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hashHex.slice(0, 16); // Use first 16 chars for shorter keys
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

const app = new Hono<{ Bindings: Bindings }>();

app.use("/*", cors());

// Rate limit status endpoint - check limits without consuming a request
app.get("/api/rate-limit-status", async (c) => {
  const ip =
    c.req.header("CF-Connecting-IP") ||
    c.req.header("X-Forwarded-For")?.split(",")[0] ||
    "unknown";
  const userAgent = c.req.header("User-Agent") || "unknown";
  const acceptLanguage = c.req.header("Accept-Language") || "unknown";
  const acceptEncoding = c.req.header("Accept-Encoding") || "unknown";

  const fingerprint = await createFingerprint(
    ip,
    userAgent,
    acceptLanguage,
    acceptEncoding,
  );
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
    whitelisted: isWhitelisted(ip, c.env),
    clientIp: ip, // Debug: show what IP we're seeing
  });
});

app.post("/api/generate", async (c) => {
  try {
    // Extract fingerprint components
    const ip =
      c.req.header("CF-Connecting-IP") ||
      c.req.header("X-Forwarded-For")?.split(",")[0] ||
      "unknown";
    const userAgent = c.req.header("User-Agent") || "unknown";
    const acceptLanguage = c.req.header("Accept-Language") || "unknown";
    const acceptEncoding = c.req.header("Accept-Encoding") || "unknown";

    // Create composite fingerprint
    const fingerprint = await createFingerprint(
      ip,
      userAgent,
      acceptLanguage,
      acceptEncoding,
    );
    const limits = getRateLimits(ip, c.env);

    // Get time buckets
    const shortTermBucket = getShortTermBucket();
    const dailyBucket = getDailyBucket();

    // Rate limit keys
    const shortTermKey = `rl:short:${fingerprint}:${shortTermBucket}`;
    const dailyKey = `rl:daily:${fingerprint}:${dailyBucket}`;

    // Check both rate limits in parallel
    const [shortTermCount, dailyCount] = await Promise.all([
      c.env.RATE_LIMIT.get(shortTermKey),
      c.env.RATE_LIMIT.get(dailyKey),
    ]);

    const currentShortTerm = shortTermCount ? parseInt(shortTermCount) : 0;
    const currentDaily = dailyCount ? parseInt(dailyCount) : 0;

    // Check short-term limit
    if (currentShortTerm >= limits.SHORT_TERM.MAX_REQUESTS) {
      const minutesIntoWindow = new Date().getUTCMinutes() % 10;
      const secondsIntoWindow = new Date().getUTCSeconds();
      const retryAfter = (10 - minutesIntoWindow) * 60 - secondsIntoWindow;

      return c.json(
        {
          success: false,
          error: `Too many requests. You can generate up to ${limits.SHORT_TERM.MAX_REQUESTS} images per ${limits.SHORT_TERM.WINDOW_MINUTES} minutes. Please wait a few minutes.`,
          retryAfter: Math.max(retryAfter, 60),
          limitType: "short_term",
        },
        429,
      );
    }

    // Check daily limit
    if (currentDaily >= limits.DAILY.MAX_REQUESTS) {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setUTCHours(24, 0, 0, 0);
      const retryAfter = Math.floor(
        (endOfDay.getTime() - now.getTime()) / 1000,
      );

      return c.json(
        {
          success: false,
          error: `Daily limit reached. You can generate up to ${limits.DAILY.MAX_REQUESTS} images per day. Try again tomorrow!`,
          retryAfter,
          limitType: "daily",
        },
        429,
      );
    }

    // Increment counters (fire-and-forget to avoid blocking)
    Promise.all([
      c.env.RATE_LIMIT.put(shortTermKey, (currentShortTerm + 1).toString(), {
        expirationTtl: limits.SHORT_TERM.TTL,
      }),
      c.env.RATE_LIMIT.put(dailyKey, (currentDaily + 1).toString(), {
        expirationTtl: limits.DAILY.TTL,
      }),
    ]).catch((err) => {
      console.error("Failed to update rate limit counters:", err);
    });

    const body = await c.req.json();
    const { person, foreground, background, branding } = body;

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
    const response = await fetch(
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
    // Return generic error to client, full details logged server-side
    return c.json(
      {
        success: false,
        error: "Failed to generate image. Please try again.",
      },
      500,
    );
  }
});

// Branding generation endpoint - uses pre-configured prompts from frontend
app.post("/api/branding/generate", async (c) => {
  try {
    // Extract fingerprint components
    const ip =
      c.req.header("CF-Connecting-IP") ||
      c.req.header("X-Forwarded-For")?.split(",")[0] ||
      "unknown";
    const userAgent = c.req.header("User-Agent") || "unknown";
    const acceptLanguage = c.req.header("Accept-Language") || "unknown";
    const acceptEncoding = c.req.header("Accept-Encoding") || "unknown";

    // Create composite fingerprint
    const fingerprint = await createFingerprint(
      ip,
      userAgent,
      acceptLanguage,
      acceptEncoding,
    );
    const limits = getRateLimits(ip, c.env);

    // Get time buckets
    const shortTermBucket = getShortTermBucket();
    const dailyBucket = getDailyBucket();

    // Rate limit keys
    const shortTermKey = `rl:short:${fingerprint}:${shortTermBucket}`;
    const dailyKey = `rl:daily:${fingerprint}:${dailyBucket}`;

    // Check both rate limits in parallel
    const [shortTermCount, dailyCount] = await Promise.all([
      c.env.RATE_LIMIT.get(shortTermKey),
      c.env.RATE_LIMIT.get(dailyKey),
    ]);

    const currentShortTerm = shortTermCount ? parseInt(shortTermCount) : 0;
    const currentDaily = dailyCount ? parseInt(dailyCount) : 0;

    // Check short-term limit
    if (currentShortTerm >= limits.SHORT_TERM.MAX_REQUESTS) {
      const minutesIntoWindow = new Date().getUTCMinutes() % 10;
      const secondsIntoWindow = new Date().getUTCSeconds();
      const retryAfter = (10 - minutesIntoWindow) * 60 - secondsIntoWindow;

      return c.json(
        {
          success: false,
          error: `Too many requests. You can generate up to ${limits.SHORT_TERM.MAX_REQUESTS} images per ${limits.SHORT_TERM.WINDOW_MINUTES} minutes. Please wait a few minutes.`,
          retryAfter: Math.max(retryAfter, 60),
          limitType: "short_term",
        },
        429,
      );
    }

    // Check daily limit
    if (currentDaily >= limits.DAILY.MAX_REQUESTS) {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setUTCHours(24, 0, 0, 0);
      const retryAfter = Math.floor(
        (endOfDay.getTime() - now.getTime()) / 1000,
      );

      return c.json(
        {
          success: false,
          error: `Daily limit reached. You can generate up to ${limits.DAILY.MAX_REQUESTS} images per day. Try again tomorrow!`,
          retryAfter,
          limitType: "daily",
        },
        429,
      );
    }

    // Increment counters (fire-and-forget to avoid blocking)
    Promise.all([
      c.env.RATE_LIMIT.put(shortTermKey, (currentShortTerm + 1).toString(), {
        expirationTtl: limits.SHORT_TERM.TTL,
      }),
      c.env.RATE_LIMIT.put(dailyKey, (currentDaily + 1).toString(), {
        expirationTtl: limits.DAILY.TTL,
      }),
    ]).catch((err) => {
      console.error("Failed to update rate limit counters:", err);
    });

    const body = await c.req.json();
    const { prompt, negativePrompt, aspectRatio } = body;

    if (!prompt) {
      return c.json({ success: false, error: "Prompt is required" }, 400);
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

    // Build request parameters
    // Note: negativePrompt is no longer supported by Imagen 4.0 as of Jan 2025
    const requestParams: any = {
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: apiAspectRatio,
      },
    };

    // Calling Imagen 4.0 via Generative Language API (using header auth)
    const response = await fetch(
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
    // Return generic error to client, full details logged server-side
    return c.json(
      {
        success: false,
        error: "Failed to generate image. Please try again.",
      },
      500,
    );
  }
});

app.get("/", (c) => {
  return c.text("WebSyncer API is running!");
});

export default app;
