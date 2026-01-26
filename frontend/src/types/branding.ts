/**
 * Branding Module Types
 * Type definitions for ARTIN premium image generation
 *
 * Naming Convention: {section}-{concept}-v{n}.webp
 * Examples: hero-athletic-v1.webp, feature-orthopedic-v2.webp
 */

export type ImageCategory = 'hero' | 'features' | 'process' | 'lifestyle' | 'product';

// Imagen 4.0 supported aspect ratios only
export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

export interface ImageSpec {
    id: string;                    // Unique ID: {category}-{concept}-v{version}
    name: string;                  // Display name
    category: ImageCategory;
    concept: string;               // Base concept (e.g., 'athletic', 'orthopedic')
    version: number;               // Version number for rotation (v1, v2, v3...)
    prompt: string;
    aspectRatio: AspectRatio;
    dimensions: { width: number; height: number };
    outputPath: string;            // Target path: {category}/{id}.webp
    subcategory?: string;          // For product gallery (e.g., 'dragon-fire')
    accentColor?: string;          // For features with accent colors
    mobileVariant?: boolean;       // If this is a mobile version
}

export interface GenerationResult {
    imageId: string;
    success: boolean;
    imageUrl?: string; // base64 data URL
    error?: string;
}

export interface BatchProgress {
    total: number;
    completed: number;
    current: string;
    results: GenerationResult[];
    cancelled?: boolean;
}

export interface RateLimitStatus {
    shortTerm: {
        used: number;
        limit: number;
        windowMinutes: number;
    };
    daily: {
        used: number;
        limit: number;
    };
    whitelisted?: boolean;
}

export interface CategoryInfo {
    id: ImageCategory;
    label: string;
    count: number;
    description: string;
}

export const CATEGORY_INFO: Record<ImageCategory, Omit<CategoryInfo, 'count'>> = {
    hero: {
        id: 'hero',
        label: 'Hero',
        description: 'Athletic action hero images with rotation support',
    },
    features: {
        id: 'features',
        label: 'Features',
        description: 'Product feature highlights',
    },
    process: {
        id: 'process',
        label: 'Process',
        description: 'Customer journey steps',
    },
    lifestyle: {
        id: 'lifestyle',
        label: 'Lifestyle',
        description: 'Sports lifestyle photography',
    },
    product: {
        id: 'product',
        label: 'Products',
        description: 'Product gallery with multiple angles',
    },
};

/**
 * Generate image ID from components
 * Format: {category}-{concept}-v{version}
 */
export function generateImageId(category: string, concept: string, version: number): string {
    return `${category}-${concept}-v${version}`;
}

/**
 * Generate output path from image spec
 * Format: {category}/{id}.webp
 */
export function generateOutputPath(category: string, id: string, subcategory?: string): string {
    if (subcategory) {
        return `${category}/${subcategory}/${id}.webp`;
    }
    return `${category}/${id}.webp`;
}
