import type {
  PathCommand,
  ParsedPath,
  CubicSegment,
  Point,
} from "../../types/pipeline";

/**
 * Tokenize an SVG path d-attribute string into commands
 */
export function parseDAttribute(d: string): PathCommand[] {
  const commands: PathCommand[] = [];
  // Match command letter followed by its numeric arguments
  const regex = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(d)) !== null) {
    const type = match[1] as PathCommand["type"];
    const valStr = match[2].trim();
    const values: number[] = [];

    if (valStr) {
      // Parse numbers including negative numbers and decimals
      const numRegex = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;
      let numMatch: RegExpExecArray | null;
      while ((numMatch = numRegex.exec(valStr)) !== null) {
        values.push(parseFloat(numMatch[0]));
      }
    }

    commands.push({ type, values });
  }

  return commands;
}

/**
 * Convert all path commands to absolute cubic Bézier segments.
 * Handles M, L, H, V, C, S, Q, T, Z — converts everything to cubics.
 */
export function commandsToCubicSegments(
  commands: PathCommand[],
): CubicSegment[] {
  const segments: CubicSegment[] = [];
  let cx = 0,
    cy = 0; // current point
  let sx = 0,
    sy = 0; // subpath start
  let lastControl: Point | null = null; // for S/T reflection
  let lastCommandType = "";

  for (const cmd of commands) {
    const { type, values } = cmd;
    const isRelative =
      type === type.toLowerCase() && type !== "z" && type !== "Z";
    const t = type.toUpperCase();

    switch (t) {
      case "M": {
        // Multiple coordinate pairs after M are treated as L
        for (let i = 0; i < values.length; i += 2) {
          const x = isRelative ? cx + values[i] : values[i];
          const y = isRelative ? cy + values[i + 1] : values[i + 1];
          if (i === 0) {
            sx = x;
            sy = y;
          } else {
            // Implicit L
            segments.push(lineToSegment(cx, cy, x, y));
          }
          cx = x;
          cy = y;
        }
        lastControl = null;
        break;
      }

      case "L": {
        for (let i = 0; i < values.length; i += 2) {
          const x = isRelative ? cx + values[i] : values[i];
          const y = isRelative ? cy + values[i + 1] : values[i + 1];
          segments.push(lineToSegment(cx, cy, x, y));
          cx = x;
          cy = y;
        }
        lastControl = null;
        break;
      }

      case "H": {
        for (const v of values) {
          const x = isRelative ? cx + v : v;
          segments.push(lineToSegment(cx, cy, x, cy));
          cx = x;
        }
        lastControl = null;
        break;
      }

      case "V": {
        for (const v of values) {
          const y = isRelative ? cy + v : v;
          segments.push(lineToSegment(cx, cy, cx, y));
          cy = y;
        }
        lastControl = null;
        break;
      }

      case "C": {
        for (let i = 0; i < values.length; i += 6) {
          const x1 = isRelative ? cx + values[i] : values[i];
          const y1 = isRelative ? cy + values[i + 1] : values[i + 1];
          const x2 = isRelative ? cx + values[i + 2] : values[i + 2];
          const y2 = isRelative ? cy + values[i + 3] : values[i + 3];
          const x = isRelative ? cx + values[i + 4] : values[i + 4];
          const y = isRelative ? cy + values[i + 5] : values[i + 5];
          segments.push({
            p0: { x: cx, y: cy },
            p1: { x: x1, y: y1 },
            p2: { x: x2, y: y2 },
            p3: { x, y },
          });
          lastControl = { x: x2, y: y2 };
          cx = x;
          cy = y;
        }
        break;
      }

      case "S": {
        for (let i = 0; i < values.length; i += 4) {
          // Reflect last control point
          let x1: number, y1: number;
          if (
            lastControl &&
            (lastCommandType === "C" || lastCommandType === "S")
          ) {
            x1 = 2 * cx - lastControl.x;
            y1 = 2 * cy - lastControl.y;
          } else {
            x1 = cx;
            y1 = cy;
          }
          const x2 = isRelative ? cx + values[i] : values[i];
          const y2 = isRelative ? cy + values[i + 1] : values[i + 1];
          const x = isRelative ? cx + values[i + 2] : values[i + 2];
          const y = isRelative ? cy + values[i + 3] : values[i + 3];
          segments.push({
            p0: { x: cx, y: cy },
            p1: { x: x1, y: y1 },
            p2: { x: x2, y: y2 },
            p3: { x, y },
          });
          lastControl = { x: x2, y: y2 };
          cx = x;
          cy = y;
        }
        break;
      }

      case "Q": {
        for (let i = 0; i < values.length; i += 4) {
          const qx = isRelative ? cx + values[i] : values[i];
          const qy = isRelative ? cy + values[i + 1] : values[i + 1];
          const x = isRelative ? cx + values[i + 2] : values[i + 2];
          const y = isRelative ? cy + values[i + 3] : values[i + 3];
          // Convert quadratic to cubic
          segments.push(quadraticToCubic(cx, cy, qx, qy, x, y));
          lastControl = { x: qx, y: qy };
          cx = x;
          cy = y;
        }
        break;
      }

      case "T": {
        for (let i = 0; i < values.length; i += 2) {
          let qx: number, qy: number;
          if (
            lastControl &&
            (lastCommandType === "Q" || lastCommandType === "T")
          ) {
            qx = 2 * cx - lastControl.x;
            qy = 2 * cy - lastControl.y;
          } else {
            qx = cx;
            qy = cy;
          }
          const x = isRelative ? cx + values[i] : values[i];
          const y = isRelative ? cy + values[i + 1] : values[i + 1];
          segments.push(quadraticToCubic(cx, cy, qx, qy, x, y));
          lastControl = { x: qx, y: qy };
          cx = x;
          cy = y;
        }
        break;
      }

      case "A": {
        // Approximate arcs as lines (good enough for Potrace output which doesn't use arcs)
        for (let i = 0; i < values.length; i += 7) {
          const x = isRelative ? cx + values[i + 5] : values[i + 5];
          const y = isRelative ? cy + values[i + 6] : values[i + 6];
          segments.push(lineToSegment(cx, cy, x, y));
          cx = x;
          cy = y;
        }
        lastControl = null;
        break;
      }

      case "Z": {
        if (cx !== sx || cy !== sy) {
          segments.push(lineToSegment(cx, cy, sx, sy));
        }
        cx = sx;
        cy = sy;
        lastControl = null;
        break;
      }
    }

    lastCommandType = t;
  }

  return segments;
}

/**
 * Create a cubic segment equivalent to a straight line
 */
function lineToSegment(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): CubicSegment {
  return {
    p0: { x: x0, y: y0 },
    p1: { x: x0 + (x1 - x0) / 3, y: y0 + (y1 - y0) / 3 },
    p2: { x: x0 + (2 * (x1 - x0)) / 3, y: y0 + (2 * (y1 - y0)) / 3 },
    p3: { x: x1, y: y1 },
  };
}

/**
 * Convert a quadratic Bézier to cubic
 */
function quadraticToCubic(
  x0: number,
  y0: number,
  qx: number,
  qy: number,
  x1: number,
  y1: number,
): CubicSegment {
  return {
    p0: { x: x0, y: y0 },
    p1: { x: x0 + (2 / 3) * (qx - x0), y: y0 + (2 / 3) * (qy - y0) },
    p2: { x: x1 + (2 / 3) * (qx - x1), y: y1 + (2 / 3) * (qy - y1) },
    p3: { x: x1, y: y1 },
  };
}

/**
 * Parse an SVG string and extract all path elements as ParsedPaths
 */
export function parseSvgPaths(svgString: string): ParsedPath[] {
  const paths: ParsedPath[] = [];
  const pathRegex = /<path[^>]*\bd="([^"]+)"[^>]*\/?>/gi;
  let match: RegExpExecArray | null;

  while ((match = pathRegex.exec(svgString)) !== null) {
    const d = match[1];
    const commands = parseDAttribute(d);
    const segments = commandsToCubicSegments(commands);
    paths.push({ d, commands, segments });
  }

  return paths;
}

/**
 * Convert CubicSegments back to an SVG path d-attribute string
 */
export function segmentsToD(segments: CubicSegment[], close = true): string {
  if (segments.length === 0) return "";

  const parts: string[] = [];
  const p = (n: number) => n.toFixed(2);

  parts.push(`M${p(segments[0].p0.x)},${p(segments[0].p0.y)}`);

  for (const seg of segments) {
    parts.push(
      `C${p(seg.p1.x)},${p(seg.p1.y)} ${p(seg.p2.x)},${p(seg.p2.y)} ${p(seg.p3.x)},${p(seg.p3.y)}`,
    );
  }

  if (close) parts.push("Z");

  return parts.join("");
}

/**
 * Extract the viewBox from an SVG string
 */
export function extractViewBox(
  svg: string,
): { x: number; y: number; width: number; height: number } | null {
  const match = svg.match(/viewBox="([^"]+)"/);
  if (!match) return null;
  const [x, y, w, h] = match[1].split(/[\s,]+/).map(Number);
  return { x, y, width: w, height: h };
}
