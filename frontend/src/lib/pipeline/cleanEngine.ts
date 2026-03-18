import type {
  ParsedPath,
  CleanStageOutput,
  CubicSegment,
  Point,
} from "../../types/pipeline";
import { parseSvgPaths } from "./svgPathParser";
import { calculatePathArea } from "./bezierMath";

export type CleanMode = "all" | "outline" | "smart";

export interface CleanOptions {
  minAreaThreshold: number;
  cleanMode: CleanMode;
  /** For "smart" mode: keep paths whose area >= this % of the largest path (0-100) */
  smartThresholdPct: number;
  targetWidth: number;
  targetHeight: number;
  padding: number;
  /** @deprecated Use cleanMode instead */
  removeHoles?: boolean;
}

export const DEFAULT_CLEAN_OPTIONS: CleanOptions = {
  minAreaThreshold: 100,
  cleanMode: "smart",
  smartThresholdPct: 5,
  targetWidth: 280,
  targetHeight: 410,
  padding: 10,
};

/**
 * Parse an SVG transform attribute into translate/scale components.
 * Handles: translate(x,y), scale(sx,sy), and matrix(a,b,c,d,e,f)
 */
function parseTransformToMatrix(transform: string): {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
} {
  // Identity matrix
  let a = 1,
    b = 0,
    c = 0,
    d = 1,
    e = 0,
    f = 0;

  if (!transform) return { a, b, c, d, e, f };

  // Parse each transform function and multiply matrices
  const regex = /(translate|scale|matrix|rotate)\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(transform)) !== null) {
    const fn = match[1];
    const vals = match[2].split(/[\s,]+/).map(Number);

    let ta = 1,
      tb = 0,
      tc = 0,
      td = 1,
      te = 0,
      tf = 0;

    switch (fn) {
      case "translate":
        te = vals[0] || 0;
        tf = vals[1] || 0;
        break;
      case "scale":
        ta = vals[0] || 1;
        td = vals.length > 1 ? vals[1] : ta;
        break;
      case "matrix":
        [ta, tb, tc, td, te, tf] = vals;
        break;
    }

    // Multiply: current * new
    const na = a * ta + c * tb;
    const nb = b * ta + d * tb;
    const nc = a * tc + c * td;
    const nd = b * tc + d * td;
    const ne = a * te + c * tf + e;
    const nf = b * te + d * tf + f;
    a = na;
    b = nb;
    c = nc;
    d = nd;
    e = ne;
    f = nf;
  }

  return { a, b, c, d, e, f };
}

function applyMatrix(
  p: Point,
  m: { a: number; b: number; c: number; d: number; e: number; f: number },
): Point {
  return {
    x: m.a * p.x + m.c * p.y + m.e,
    y: m.b * p.x + m.d * p.y + m.f,
  };
}

function transformSegment(
  seg: CubicSegment,
  m: { a: number; b: number; c: number; d: number; e: number; f: number },
): CubicSegment {
  return {
    p0: applyMatrix(seg.p0, m),
    p1: applyMatrix(seg.p1, m),
    p2: applyMatrix(seg.p2, m),
    p3: applyMatrix(seg.p3, m),
  };
}

/**
 * Stage 2: Clean traced SVG
 *
 * 1. Parse SVG with DOMParser to preserve Potrace's group transforms
 * 2. Filter paths by area
 * 3. Build display SVG (preserving original content + transforms)
 * 4. Compute transformed segments in target viewBox space for zone split
 */
export function cleanSvg(
  svgString: string,
  options: CleanOptions,
): CleanStageOutput {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, "image/svg+xml");
  const svgEl = doc.querySelector("svg");
  if (!svgEl) throw new Error("No SVG element found");

  // Get original viewBox
  const vb = svgEl.getAttribute("viewBox");
  const [, , origW, origH] = (vb || "0 0 100 100").split(/[\s,]+/).map(Number);

  // Collect all group transforms above the path elements
  const groupTransforms: string[] = [];
  const groups = doc.querySelectorAll("g");
  groups.forEach((g) => {
    const t = g.getAttribute("transform");
    if (t) groupTransforms.push(t);
  });

  // Parse combined group transform matrix (Potrace may add Y-flip)
  const combinedGroupTransform = groupTransforms.join(" ");
  const potraceMatrix = parseTransformToMatrix(combinedGroupTransform);

  // Parse all path d-attributes and compute areas
  const allPaths = parseSvgPaths(svgString);
  const pathElements = Array.from(doc.querySelectorAll("path"));

  const pathsWithArea = allPaths.map((p, i) => ({
    parsedPath: p,
    element: pathElements[i],
    area: calculatePathArea(p.segments),
  }));

  pathsWithArea.sort((a, b) => b.area - a.area);

  let filtered = pathsWithArea.filter(
    (p) => p.area >= options.minAreaThreshold,
  );

  // Determine effective clean mode (handle legacy removeHoles flag)
  const mode = options.removeHoles ? "outline" : (options.cleanMode ?? "smart");

  if (mode === "outline" && filtered.length > 1) {
    // Keep only the single largest path
    filtered = [filtered[0]];
  } else if (mode === "smart" && filtered.length > 1) {
    // Keep paths whose area is at least N% of the largest path
    const largestArea = filtered[0].area;
    const threshold = largestArea * ((options.smartThresholdPct ?? 5) / 100);
    filtered = filtered.filter((p) => p.area >= threshold);
  }
  // mode === "all": keep everything above minAreaThreshold

  const keptDAttributes = new Set(filtered.map((f) => f.parsedPath.d));
  const removedCount = allPaths.length - filtered.length;

  // Remove unwanted paths from DOM
  for (const pe of pathElements) {
    const d = pe.getAttribute("d");
    if (d && !keptDAttributes.has(d)) {
      pe.remove();
    }
  }

  // Compute our scaling transform to fit into target viewBox
  const { targetWidth: tw, targetHeight: th, padding } = options;
  const availW = tw - 2 * padding;
  const availH = th - 2 * padding;
  const scale = Math.min(availW / origW, availH / origH);
  const offsetX = padding + (availW - origW * scale) / 2;
  const offsetY = padding + (availH - origH * scale) / 2;

  // Build display SVG (preserving original inner content with transforms)
  const innerContent = svgEl.innerHTML;
  const whiteContent = innerContent
    .replace(/fill="[^"]*"/g, 'fill="white"')
    .replace(/fill:[^;"]+/g, "fill:white");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tw} ${th}" width="${tw}" height="${th}">
  <g transform="translate(${offsetX.toFixed(2)},${offsetY.toFixed(2)}) scale(${scale.toFixed(6)})">
${whiteContent}
  </g>
</svg>`;

  // Build combined transform matrix: Potrace transform → our scaling
  // Combined: translate(offsetX, offsetY) * scale(s) * potraceMatrix
  const ourMatrix = parseTransformToMatrix(
    `translate(${offsetX},${offsetY}) scale(${scale})`,
  );
  // Multiply: our * potrace
  const finalMatrix = {
    a: ourMatrix.a * potraceMatrix.a + ourMatrix.c * potraceMatrix.b,
    b: ourMatrix.b * potraceMatrix.a + ourMatrix.d * potraceMatrix.b,
    c: ourMatrix.a * potraceMatrix.c + ourMatrix.c * potraceMatrix.d,
    d: ourMatrix.b * potraceMatrix.c + ourMatrix.d * potraceMatrix.d,
    e:
      ourMatrix.a * potraceMatrix.e +
      ourMatrix.c * potraceMatrix.f +
      ourMatrix.e,
    f:
      ourMatrix.b * potraceMatrix.e +
      ourMatrix.d * potraceMatrix.f +
      ourMatrix.f,
  };

  // Transform all kept path segments into target viewBox coordinate space
  const normalizedPaths: ParsedPath[] = filtered.map(({ parsedPath }) => {
    const transformedSegments = parsedPath.segments.map((seg) =>
      transformSegment(seg, finalMatrix),
    );
    return {
      ...parsedPath,
      segments: transformedSegments,
    };
  });

  return {
    svg,
    paths: normalizedPaths,
    pathCount: normalizedPaths.length,
    removedCount,
    viewBox: { width: tw, height: th },
  };
}
