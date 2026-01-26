/**
 * Download Helpers
 * Utilities for file downloads and ZIP creation
 */

import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface ProcessedImage {
    name: string;
    blob: Blob;
    folder?: string;
}

/**
 * Download a single file
 */
export function downloadFile(blob: Blob, filename: string): void {
    saveAs(blob, filename);
}

/**
 * Create and download a ZIP file with multiple images
 */
export async function downloadAsZip(
    images: ProcessedImage[],
    zipName: string
): Promise<void> {
    const zip = new JSZip();

    for (const image of images) {
        const path = image.folder ? `${image.folder}/${image.name}` : image.name;
        zip.file(path, image.blob);
    }

    const content = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
    });

    saveAs(content, zipName);
}

/**
 * Create data URL from blob for preview
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Get file extension from format
 */
export function getExtension(format: string): string {
    switch (format) {
        case 'image/jpeg':
            return 'jpg';
        case 'image/png':
            return 'png';
        case 'image/webp':
            return 'webp';
        default:
            return 'png';
    }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get filename without extension
 */
export function getBaseName(filename: string): string {
    return filename.replace(/\.[^/.]+$/, '');
}
