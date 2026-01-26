/**
 * HEIC Image Processing
 * Convert Apple HEIC/HEIF images to standard formats
 */

import heic2any from "heic2any";

/**
 * Check if file is a HEIC/HEIF image by extension
 */
export function isHeicFile(file: File): boolean {
  const ext = file.name.toLowerCase().split(".").pop();
  return ext === "heic" || ext === "heif";
}

/**
 * Validate HEIC file before processing
 */
export function validateHeicFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!isHeicFile(file)) {
    return { valid: false, error: "File is not HEIC/HEIF format" };
  }

  // Max 100MB to prevent browser memory issues
  const maxSize = 100 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: "File exceeds 100MB limit" };
  }

  return { valid: true };
}

/**
 * Convert HEIC file to a standard image Blob
 */
export async function convertHeicToBlob(
  file: File,
  outputType: "image/jpeg" | "image/png" = "image/png",
  quality: number = 0.92,
): Promise<Blob> {
  const result = await heic2any({
    blob: file,
    toType: outputType,
    quality: quality,
  });

  // heic2any can return array for multi-image HEIC
  if (Array.isArray(result)) {
    return result[0];
  }
  return result;
}
