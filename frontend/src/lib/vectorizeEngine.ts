import type { TraceParams, TraceResult } from "../types/vectorize";

// Dynamic import for WASM module — returns the `potrace` function directly
type PotraceFn = (typeof import("esm-potrace-wasm"))["potrace"];
let potraceFn: PotraceFn | null = null;

async function getPotraceTrace(): Promise<PotraceFn> {
  if (!potraceFn) {
    const mod = await import("esm-potrace-wasm");
    potraceFn = mod.potrace;
  }
  return potraceFn;
}

/**
 * Load an image file into an HTMLImageElement
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/**
 * Get ImageData from an HTMLImageElement, optionally downsampled
 */
function getImageData(
  img: HTMLImageElement,
  maxDimension?: number,
): { data: ImageData; width: number; height: number; scale: number } {
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  let scale = 1;

  if (maxDimension && (w > maxDimension || h > maxDimension)) {
    scale = maxDimension / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);

  return {
    data: ctx.getImageData(0, 0, w, h),
    width: w,
    height: h,
    scale,
  };
}

/**
 * Apply threshold to convert to black & white ImageData
 */
function applyThreshold(
  imageData: ImageData,
  threshold: number,
  invert: boolean,
): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  for (let i = 0; i < data.length; i += 4) {
    // Grayscale using luminance
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const val = gray >= threshold ? 255 : 0;
    const finalVal = invert ? 255 - val : val;
    data[i] = finalVal;
    data[i + 1] = finalVal;
    data[i + 2] = finalVal;
    data[i + 3] = 255;
  }
  return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Apply Sobel edge detection
 */
function applyEdgeDetection(
  imageData: ImageData,
  threshold: number,
  invert: boolean,
): ImageData {
  const { width, height } = imageData;
  const src = imageData.data;
  const result = new Uint8ClampedArray(src.length);

  // Convert to grayscale first
  const gray = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    const j = i * 4;
    gray[i] = src[j] * 0.299 + src[j + 1] * 0.587 + src[j + 2] * 0.114;
  }

  // Sobel kernels
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      const tl = gray[(y - 1) * width + (x - 1)];
      const t = gray[(y - 1) * width + x];
      const tr = gray[(y - 1) * width + (x + 1)];
      const l = gray[y * width + (x - 1)];
      const r = gray[y * width + (x + 1)];
      const bl = gray[(y + 1) * width + (x - 1)];
      const b = gray[(y + 1) * width + x];
      const br = gray[(y + 1) * width + (x + 1)];

      const gx = -tl - 2 * l - bl + tr + 2 * r + br;
      const gy = -tl - 2 * t - tr + bl + 2 * b + br;
      const magnitude = Math.sqrt(gx * gx + gy * gy);

      // Edges are white (high magnitude) on black background
      let val = magnitude > threshold ? 0 : 255;
      if (invert) val = 255 - val;

      const pi = idx * 4;
      result[pi] = val;
      result[pi + 1] = val;
      result[pi + 2] = val;
      result[pi + 3] = 255;
    }
  }

  // Border pixels
  for (let x = 0; x < width; x++) {
    const topIdx = x * 4;
    const botIdx = ((height - 1) * width + x) * 4;
    result[topIdx] = result[topIdx + 1] = result[topIdx + 2] = 255;
    result[topIdx + 3] = 255;
    result[botIdx] = result[botIdx + 1] = result[botIdx + 2] = 255;
    result[botIdx + 3] = 255;
  }
  for (let y = 0; y < height; y++) {
    const leftIdx = y * width * 4;
    const rightIdx = (y * width + width - 1) * 4;
    result[leftIdx] = result[leftIdx + 1] = result[leftIdx + 2] = 255;
    result[leftIdx + 3] = 255;
    result[rightIdx] = result[rightIdx + 1] = result[rightIdx + 2] = 255;
    result[rightIdx + 3] = 255;
  }

  return new ImageData(result, width, height);
}

/**
 * Quantize colors using median cut algorithm (simplified)
 */
function quantizeColors(
  imageData: ImageData,
  colorCount: number,
): { colors: [number, number, number][]; indexed: Uint8Array } {
  const { data, width, height } = imageData;
  const pixels: [number, number, number][] = [];

  for (let i = 0; i < data.length; i += 4) {
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }

  // Simple k-means quantization
  let centroids: [number, number, number][] = [];
  for (let i = 0; i < colorCount; i++) {
    const idx = Math.floor((i / colorCount) * pixels.length);
    centroids.push([...pixels[idx]]);
  }

  const indexed = new Uint8Array(width * height);

  // Run k-means for a few iterations
  for (let iter = 0; iter < 10; iter++) {
    const sums: [number, number, number][] = centroids.map(() => [0, 0, 0]);
    const counts = new Array(colorCount).fill(0);

    for (let i = 0; i < pixels.length; i++) {
      const p = pixels[i];
      let minDist = Infinity;
      let nearest = 0;

      for (let c = 0; c < centroids.length; c++) {
        const d =
          (p[0] - centroids[c][0]) ** 2 +
          (p[1] - centroids[c][1]) ** 2 +
          (p[2] - centroids[c][2]) ** 2;
        if (d < minDist) {
          minDist = d;
          nearest = c;
        }
      }

      indexed[i] = nearest;
      sums[nearest][0] += p[0];
      sums[nearest][1] += p[1];
      sums[nearest][2] += p[2];
      counts[nearest]++;
    }

    centroids = centroids.map((c, i) =>
      counts[i] > 0
        ? [
            Math.round(sums[i][0] / counts[i]),
            Math.round(sums[i][1] / counts[i]),
            Math.round(sums[i][2] / counts[i]),
          ]
        : c,
    );
  }

  return { colors: centroids, indexed };
}

/**
 * Create a binary ImageData for a specific color layer
 */
function createColorLayer(
  indexed: Uint8Array,
  colorIndex: number,
  width: number,
  height: number,
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < indexed.length; i++) {
    const val = indexed[i] === colorIndex ? 0 : 255;
    const j = i * 4;
    data[j] = val;
    data[j + 1] = val;
    data[j + 2] = val;
    data[j + 3] = 255;
  }
  return new ImageData(data, width, height);
}

/**
 * Count SVG path nodes (approximate by counting path commands)
 */
function countNodes(svgString: string): number {
  const pathCommands = svgString.match(/[MLHVCSQTAZ]/gi);
  return pathCommands ? pathCommands.length : 0;
}

/**
 * Count SVG paths
 */
function countPaths(svgString: string): number {
  const paths = svgString.match(/<path/gi);
  return paths ? paths.length : 0;
}

/**
 * Clean SVG output: reduce coordinate precision, proper viewBox
 */
function cleanSvg(
  svg: string,
  width: number,
  height: number,
  scaleFactor: number,
): string {
  // Reduce coordinate precision to 2 decimal places
  let cleaned = svg.replace(/(\d+\.\d{3,})/g, (match) =>
    parseFloat(match).toFixed(2),
  );

  // Fix viewBox if needed
  const scaledW = Math.round(width * scaleFactor);
  const scaledH = Math.round(height * scaleFactor);

  // Replace the SVG opening tag to ensure proper viewBox and dimensions
  cleaned = cleaned.replace(
    /<svg[^>]*>/,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${scaledW}" height="${scaledH}">`,
  );

  return cleaned;
}

/**
 * Trace a B&W image using Potrace WASM
 */
async function traceBW(
  img: HTMLImageElement,
  params: TraceParams,
  maxDimension?: number,
): Promise<TraceResult> {
  const trace = await getPotraceTrace();
  const { data: imageData, width, height } = getImageData(img, maxDimension);

  const processed = applyThreshold(imageData, params.threshold, params.invert);

  // Put processed data on a temporary canvas to create an ImageBitmap
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.putImageData(processed, 0, 0);

  const svg = await trace(canvas, {
    turdsize: params.turdSize,
    alphamax: params.alphaMax,
    opttolerance: params.optTolerance,
    turnpolicy: params.turnPolicy,
  });

  const cleanedSvg = cleanSvg(svg, width, height, params.scale);

  return {
    svg: cleanedSvg,
    pathCount: countPaths(cleanedSvg),
    nodeCount: countNodes(cleanedSvg),
    width,
    height,
  };
}

/**
 * Trace edges using Sobel + Potrace
 */
async function traceEdges(
  img: HTMLImageElement,
  params: TraceParams,
  maxDimension?: number,
): Promise<TraceResult> {
  const trace = await getPotraceTrace();
  const { data: imageData, width, height } = getImageData(img, maxDimension);

  const edgeData = applyEdgeDetection(
    imageData,
    params.threshold,
    params.invert,
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.putImageData(edgeData, 0, 0);

  const svg = await trace(canvas, {
    turdsize: params.turdSize,
    alphamax: params.alphaMax,
    opttolerance: params.optTolerance,
    turnpolicy: params.turnPolicy,
  });

  const cleanedSvg = cleanSvg(svg, width, height, params.scale);

  return {
    svg: cleanedSvg,
    pathCount: countPaths(cleanedSvg),
    nodeCount: countNodes(cleanedSvg),
    width,
    height,
  };
}

/**
 * Multi-color trace: quantize + trace each color layer
 */
async function traceColor(
  img: HTMLImageElement,
  params: TraceParams,
  maxDimension?: number,
): Promise<TraceResult> {
  const trace = await getPotraceTrace();
  const { data: imageData, width, height } = getImageData(img, maxDimension);

  const { colors, indexed } = quantizeColors(imageData, params.colorCount);

  const layerSvgs: string[] = [];

  for (let i = 0; i < colors.length; i++) {
    const layerData = createColorLayer(indexed, i, width, height);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.putImageData(layerData, 0, 0);

    const layerSvg = await trace(canvas, {
      turdsize: params.turdSize,
      alphamax: params.alphaMax,
      opttolerance: params.optTolerance,
      turnpolicy: params.turnPolicy,
    });

    // Extract paths from the SVG and colorize them
    const pathMatches = layerSvg.match(/<path[^>]*\/>/g);
    if (pathMatches) {
      const [r, g, b] = colors[i];
      const colorHex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
      for (const path of pathMatches) {
        // Replace fill color
        const coloredPath = path
          .replace(/fill="[^"]*"/, `fill="${colorHex}"`)
          .replace(/fill:[^;"]*/, `fill:${colorHex}`);
        layerSvgs.push(
          coloredPath.includes("fill=")
            ? coloredPath
            : path.replace("/>", ` fill="${colorHex}"/>`),
        );
      }
    }
  }

  const scaledW = Math.round(width * params.scale);
  const scaledH = Math.round(height * params.scale);

  const combinedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${scaledW}" height="${scaledH}">
${layerSvgs.join("\n")}
</svg>`;

  const cleaned = combinedSvg.replace(/(\d+\.\d{3,})/g, (match) =>
    parseFloat(match).toFixed(2),
  );

  return {
    svg: cleaned,
    pathCount: countPaths(cleaned),
    nodeCount: countNodes(cleaned),
    width,
    height,
  };
}

/**
 * Main trace function — dispatches to the appropriate mode
 */
export async function traceImage(
  img: HTMLImageElement,
  params: TraceParams,
  preview = false,
): Promise<TraceResult> {
  // For preview, downsample large images to max 800px
  const maxDimension = preview ? 800 : undefined;

  switch (params.mode) {
    case "bw":
      return traceBW(img, params, maxDimension);
    case "edge":
      return traceEdges(img, params, maxDimension);
    case "color":
      return traceColor(img, params, maxDimension);
    default:
      return traceBW(img, params, maxDimension);
  }
}

/**
 * Render SVG to PNG blob at a given resolution
 */
export function svgToPng(
  svgString: string,
  width: number,
  height: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to render PNG"));
      }, "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to render SVG to canvas"));
    };
    img.src = url;
  });
}

/**
 * Generate a preview thumbnail of the thresholded/processed image
 * (for the before/after comparison of what Potrace actually sees)
 */
export function getProcessedPreview(
  img: HTMLImageElement,
  params: TraceParams,
  maxDimension = 400,
): string {
  const { data: imageData, width, height } = getImageData(img, maxDimension);

  let processed: ImageData;
  if (params.mode === "edge") {
    processed = applyEdgeDetection(imageData, params.threshold, params.invert);
  } else {
    processed = applyThreshold(imageData, params.threshold, params.invert);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.putImageData(processed, 0, 0);

  return canvas.toDataURL("image/png");
}
