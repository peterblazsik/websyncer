/**
 * Image Processing Library
 * Client-side image manipulation using Canvas API
 */

export interface ImageSize {
    name: string;
    width: number;
    height: number;
}

// App Store Screenshot Sizes (iPhone)
export const APPSTORE_SIZES: ImageSize[] = [
    { name: '6.9', width: 1320, height: 2868 },  // iPhone 16 Pro Max
    { name: '6.7', width: 1290, height: 2796 },  // iPhone 14/15/16 Pro Max
    { name: '6.5', width: 1242, height: 2688 },  // iPhone 11 Pro Max, XS Max
    { name: '6.1', width: 1179, height: 2556 },  // iPhone 14/15/16
    { name: '5.5', width: 1242, height: 2208 },  // iPhone 8 Plus
];

// iOS App Icon Sizes
export const IOS_ICON_SIZES: ImageSize[] = [
    { name: 'AppStore', width: 1024, height: 1024 },
    { name: 'iPhone_180', width: 180, height: 180 },
    { name: 'iPhone_120', width: 120, height: 120 },
    { name: 'iPad_167', width: 167, height: 167 },
    { name: 'iPad_152', width: 152, height: 152 },
    { name: 'Settings_87', width: 87, height: 87 },
    { name: 'Settings_58', width: 58, height: 58 },
    { name: 'Spotlight_120', width: 120, height: 120 },
    { name: 'Spotlight_80', width: 80, height: 80 },
    { name: 'Notification_60', width: 60, height: 60 },
    { name: 'Notification_40', width: 40, height: 40 },
];

// macOS Icon Sizes (for iconset folder)
export const MACOS_ICONSET_SIZES: ImageSize[] = [
    { name: 'icon_16x16', width: 16, height: 16 },
    { name: 'icon_16x16@2x', width: 32, height: 32 },
    { name: 'icon_32x32', width: 32, height: 32 },
    { name: 'icon_32x32@2x', width: 64, height: 64 },
    { name: 'icon_128x128', width: 128, height: 128 },
    { name: 'icon_128x128@2x', width: 256, height: 256 },
    { name: 'icon_256x256', width: 256, height: 256 },
    { name: 'icon_256x256@2x', width: 512, height: 512 },
    { name: 'icon_512x512', width: 512, height: 512 },
    { name: 'icon_512x512@2x', width: 1024, height: 1024 },
];

// Web/Favicon Sizes
export const WEB_ICON_SIZES: number[] = [16, 32, 48, 64, 128, 192, 512, 1024];

// WebP Variant Sizes
export const WEBP_VARIANTS: ImageSize[] = [
    { name: 'hero-desktop', width: 1920, height: 1080 },
    { name: 'hero-mobile', width: 750, height: 1000 },
    { name: 'feature', width: 400, height: 400 },
    { name: 'lifestyle', width: 1200, height: 800 },
];

// Variant to folder mapping
export const VARIANT_FOLDERS: Record<string, string> = {
    'hero-desktop': 'hero',
    'hero-mobile': 'hero',
    'feature': 'features',
    'lifestyle': 'lifestyle',
    'original': 'product',
};

export type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp';

/**
 * Load an image file and return an HTMLImageElement
 * Includes timeout and better error handling for invalid formats
 */
export function loadImage(file: File | Blob, timeoutMs: number = 30000): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        const timeoutId = setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Image load timed out - file may be corrupted or not a valid image format'));
        }, timeoutMs);

        img.onload = () => {
            clearTimeout(timeoutId);
            URL.revokeObjectURL(objectUrl);
            resolve(img);
        };
        img.onerror = () => {
            clearTimeout(timeoutId);
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image - file may be corrupted or not a valid image format'));
        };
        img.src = objectUrl;
    });
}

/**
 * Resize and crop image to exact dimensions using Canvas (crop-to-fill/center crop)
 */
export async function resizeImage(
    source: File | Blob | HTMLImageElement,
    targetWidth: number,
    targetHeight: number,
    format: ImageFormat = 'image/webp',
    quality: number = 0.8
): Promise<Blob> {
    const img = source instanceof HTMLImageElement ? source : await loadImage(source);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d')!;

    // Calculate crop to fill (center crop)
    const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    const x = (targetWidth - scaledWidth) / 2;
    const y = (targetHeight - scaledHeight) / 2;

    // White background for JPG (no transparency)
    if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
            format,
            quality
        );
    });
}

/**
 * Resize image maintaining aspect ratio (fit within bounds)
 */
export async function resizeImageFit(
    source: File | Blob | HTMLImageElement,
    maxWidth: number,
    maxHeight: number,
    format: ImageFormat = 'image/webp',
    quality: number = 0.8
): Promise<Blob> {
    const img = source instanceof HTMLImageElement ? source : await loadImage(source);

    const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
    const targetWidth = Math.round(img.width * scale);
    const targetHeight = Math.round(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d')!;

    if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
            format,
            quality
        );
    });
}

/**
 * Crop image to square from center
 */
export async function cropToSquare(source: File | Blob | HTMLImageElement): Promise<Blob> {
    const img = source instanceof HTMLImageElement ? source : await loadImage(source);

    const size = Math.min(img.width, img.height);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const x = (img.width - size) / 2;
    const y = (img.height - size) / 2;
    ctx.drawImage(img, x, y, size, size, 0, 0, size, size);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Crop failed'))),
            'image/png'
        );
    });
}

/**
 * Convert image to specified format without resizing
 */
export async function convertFormat(
    source: File | Blob | HTMLImageElement,
    format: ImageFormat,
    quality: number = 0.9
): Promise<Blob> {
    const img = source instanceof HTMLImageElement ? source : await loadImage(source);

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;

    if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, img.width, img.height);
    }

    ctx.drawImage(img, 0, 0);

    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Format conversion failed'))),
            format,
            quality
        );
    });
}

/**
 * Get image dimensions from file
 */
export async function getImageDimensions(file: File | Blob): Promise<{ width: number; height: number }> {
    const img = await loadImage(file);
    return { width: img.width, height: img.height };
}

/**
 * Watermark position options
 */
export type WatermarkPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

/**
 * Watermark options
 */
export interface WatermarkOptions {
    position: WatermarkPosition;
    scale: number;      // Logo size as percentage of smaller image dimension (e.g., 0.08 = 8%)
    padding: number;    // Pixels from edge
    opacity: number;    // 0-1 transparency
}

/**
 * Default watermark options
 */
export const DEFAULT_WATERMARK_OPTIONS: WatermarkOptions = {
    position: 'bottom-right',
    scale: 0.08,
    padding: 20,
    opacity: 0.7,
};

/**
 * Load an image from a URL (for loading logo assets from public folder)
 */
export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image from URL: ${url}`));
        img.src = url;
    });
}

/**
 * Add a logo watermark to an image
 * Returns a new Blob with the watermark applied
 */
export async function addLogoWatermark(
    source: File | Blob | HTMLImageElement,
    logoUrl: string,
    options: Partial<WatermarkOptions> = {}
): Promise<Blob> {
    const opts = { ...DEFAULT_WATERMARK_OPTIONS, ...options };

    // Load source image and logo
    const sourceImg = source instanceof HTMLImageElement ? source : await loadImage(source);
    const logoImg = await loadImageFromUrl(logoUrl);

    // Create canvas at source image dimensions
    const canvas = document.createElement('canvas');
    canvas.width = sourceImg.width;
    canvas.height = sourceImg.height;
    const ctx = canvas.getContext('2d')!;

    // Draw source image
    ctx.drawImage(sourceImg, 0, 0);

    // Calculate logo size proportionally to image dimensions
    const smallerDimension = Math.min(sourceImg.width, sourceImg.height);
    const logoHeight = Math.round(smallerDimension * opts.scale);
    const logoAspectRatio = logoImg.width / logoImg.height;
    const logoWidth = Math.round(logoHeight * logoAspectRatio);

    // Calculate position based on corner + padding
    let x: number;
    let y: number;

    switch (opts.position) {
        case 'top-left':
            x = opts.padding;
            y = opts.padding;
            break;
        case 'top-right':
            x = sourceImg.width - logoWidth - opts.padding;
            y = opts.padding;
            break;
        case 'bottom-left':
            x = opts.padding;
            y = sourceImg.height - logoHeight - opts.padding;
            break;
        case 'bottom-right':
        default:
            x = sourceImg.width - logoWidth - opts.padding;
            y = sourceImg.height - logoHeight - opts.padding;
            break;
    }

    // Apply opacity and draw logo
    ctx.globalAlpha = opts.opacity;
    ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);
    ctx.globalAlpha = 1.0; // Reset alpha

    // Return as PNG blob (will be converted to WebP later in the flow)
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create watermarked image'))),
            'image/png'
        );
    });
}
