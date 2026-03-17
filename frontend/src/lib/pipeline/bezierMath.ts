import type { CubicSegment, Point } from "../../types/pipeline";

/**
 * Evaluate a cubic Bézier at parameter t using de Casteljau's algorithm
 */
export function evaluateCubic(seg: CubicSegment, t: number): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x:
      mt2 * mt * seg.p0.x +
      3 * mt2 * t * seg.p1.x +
      3 * mt * t2 * seg.p2.x +
      t2 * t * seg.p3.x,
    y:
      mt2 * mt * seg.p0.y +
      3 * mt2 * t * seg.p1.y +
      3 * mt * t2 * seg.p2.y +
      t2 * t * seg.p3.y,
  };
}

/**
 * Split a cubic Bézier at parameter t using de Casteljau, returns [left, right]
 */
export function splitCubicAt(
  seg: CubicSegment,
  t: number,
): [CubicSegment, CubicSegment] {
  const { p0, p1, p2, p3 } = seg;

  const a = lerp(p0, p1, t);
  const b = lerp(p1, p2, t);
  const c = lerp(p2, p3, t);
  const d = lerp(a, b, t);
  const e = lerp(b, c, t);
  const f = lerp(d, e, t);

  return [
    { p0, p1: a, p2: d, p3: f },
    { p0: f, p1: e, p2: c, p3 },
  ];
}

/**
 * Split a cubic at multiple t-values (must be sorted ascending)
 */
export function splitCubicAtMultiple(
  seg: CubicSegment,
  tValues: number[],
): CubicSegment[] {
  if (tValues.length === 0) return [seg];

  const sorted = [...tValues].sort((a, b) => a - b);
  const result: CubicSegment[] = [];
  let remaining = seg;
  let consumed = 0;

  for (const t of sorted) {
    // Remap t relative to remaining segment
    const localT = (t - consumed) / (1 - consumed);
    if (localT <= 0 || localT >= 1) continue;

    const [left, right] = splitCubicAt(remaining, localT);
    result.push(left);
    remaining = right;
    consumed = t;
  }

  result.push(remaining);
  return result;
}

/**
 * Find all t values where a cubic's Y coordinate equals k.
 * Solves: a*t³ + b*t² + c*t + d = 0 where the cubic is the Y component minus k.
 */
export function cubicYIntersections(seg: CubicSegment, k: number): number[] {
  const { p0, p1, p2, p3 } = seg;
  return solveCubicForAxis(p0.y, p1.y, p2.y, p3.y, k);
}

/**
 * Find all t values where a cubic's X coordinate equals k.
 */
export function cubicXIntersections(seg: CubicSegment, k: number): number[] {
  const { p0, p1, p2, p3 } = seg;
  return solveCubicForAxis(p0.x, p1.x, p2.x, p3.x, k);
}

/**
 * Solve for t in: B(t) = k, where B(t) is a cubic Bézier in one axis.
 * B(t) = (1-t)³·v0 + 3(1-t)²t·v1 + 3(1-t)t²·v2 + t³·v3
 * Rearranges to: a·t³ + b·t² + c·t + d = 0
 */
function solveCubicForAxis(
  v0: number,
  v1: number,
  v2: number,
  v3: number,
  k: number,
): number[] {
  const a = -v0 + 3 * v1 - 3 * v2 + v3;
  const b = 3 * v0 - 6 * v1 + 3 * v2;
  const c = -3 * v0 + 3 * v1;
  const d = v0 - k;

  return solveCubicEquation(a, b, c, d).filter((t) => t > 1e-6 && t < 1 - 1e-6);
}

/**
 * Solve a·t³ + b·t² + c·t + d = 0 — real roots only
 */
function solveCubicEquation(
  a: number,
  b: number,
  c: number,
  d: number,
): number[] {
  const EPS = 1e-10;

  // Degenerate: linear
  if (Math.abs(a) < EPS && Math.abs(b) < EPS) {
    if (Math.abs(c) < EPS) return [];
    return [-d / c];
  }

  // Degenerate: quadratic
  if (Math.abs(a) < EPS) {
    const disc = c * c - 4 * b * d;
    if (disc < 0) return [];
    const sqrtDisc = Math.sqrt(disc);
    return [(-c + sqrtDisc) / (2 * b), (-c - sqrtDisc) / (2 * b)];
  }

  // Normalize
  const p = b / a;
  const q = c / a;
  const r = d / a;

  // Depressed cubic: t = u - p/3
  const p3 = p / 3;
  const Q = (3 * q - p * p) / 9;
  const R = (9 * p * q - 27 * r - 2 * p * p * p) / 54;
  const D = Q * Q * Q + R * R;

  const results: number[] = [];

  if (D >= 0) {
    const sqrtD = Math.sqrt(D);
    const S = cbrt(R + sqrtD);
    const T = cbrt(R - sqrtD);
    results.push(S + T - p3);
    // Only real root from this branch
  } else {
    // Three real roots
    const theta = Math.acos(R / Math.sqrt(-Q * Q * Q));
    const sqrtNegQ2 = 2 * Math.sqrt(-Q);
    results.push(sqrtNegQ2 * Math.cos(theta / 3) - p3);
    results.push(sqrtNegQ2 * Math.cos((theta + 2 * Math.PI) / 3) - p3);
    results.push(sqrtNegQ2 * Math.cos((theta + 4 * Math.PI) / 3) - p3);
  }

  return results;
}

function cbrt(x: number): number {
  return x >= 0 ? Math.pow(x, 1 / 3) : -Math.pow(-x, 1 / 3);
}

/**
 * Calculate the signed area of a path made of cubic segments using Green's theorem.
 * Approximate by sampling each segment.
 */
export function calculatePathArea(segments: CubicSegment[]): number {
  let area = 0;
  const samplesPerSegment = 20;

  for (const seg of segments) {
    for (let i = 0; i < samplesPerSegment; i++) {
      const t0 = i / samplesPerSegment;
      const t1 = (i + 1) / samplesPerSegment;
      const p0 = evaluateCubic(seg, t0);
      const p1 = evaluateCubic(seg, t1);
      // Shoelace contribution
      area += p0.x * p1.y - p1.x * p0.y;
    }
  }

  return Math.abs(area / 2);
}

/**
 * Get the bounding box of a set of cubic segments
 */
export function getSegmentsBounds(segments: CubicSegment[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  for (const seg of segments) {
    // Sample at enough points to capture extrema
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const pt = evaluateCubic(seg, t);
      if (pt.x < minX) minX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y > maxY) maxY = pt.y;
    }
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Scale and translate segments to fit within a target viewBox
 */
export function normalizeSegments(
  segments: CubicSegment[],
  targetWidth: number,
  targetHeight: number,
  padding = 10,
): CubicSegment[] {
  const bounds = getSegmentsBounds(segments);
  const srcW = bounds.maxX - bounds.minX;
  const srcH = bounds.maxY - bounds.minY;

  if (srcW === 0 || srcH === 0) return segments;

  const availW = targetWidth - 2 * padding;
  const availH = targetHeight - 2 * padding;
  const scale = Math.min(availW / srcW, availH / srcH);

  const offsetX = padding + (availW - srcW * scale) / 2 - bounds.minX * scale;
  const offsetY = padding + (availH - srcH * scale) / 2 - bounds.minY * scale;

  return segments.map((seg) => ({
    p0: transformPoint(seg.p0, scale, offsetX, offsetY),
    p1: transformPoint(seg.p1, scale, offsetX, offsetY),
    p2: transformPoint(seg.p2, scale, offsetX, offsetY),
    p3: transformPoint(seg.p3, scale, offsetX, offsetY),
  }));
}

function transformPoint(
  p: Point,
  scale: number,
  offsetX: number,
  offsetY: number,
): Point {
  return {
    x: p.x * scale + offsetX,
    y: p.y * scale + offsetY,
  };
}

function lerp(a: Point, b: Point, t: number): Point {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}
