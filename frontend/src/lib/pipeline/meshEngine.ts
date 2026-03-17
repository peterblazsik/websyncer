import * as THREE from "three";

/**
 * Convert an SVG path d-string to a THREE.Shape by sampling cubic beziers.
 */
export function svgPathToShape(d: string): THREE.Shape {
  const shape = new THREE.Shape();
  const commands = parseDToCommands(d);

  let cx = 0,
    cy = 0;
  let startX = 0,
    startY = 0;

  for (const cmd of commands) {
    switch (cmd.type) {
      case "M":
        cx = cmd.values[0];
        cy = cmd.values[1];
        startX = cx;
        startY = cy;
        shape.moveTo(cx, -cy); // Flip Y for Three.js
        break;
      case "L":
        cx = cmd.values[0];
        cy = cmd.values[1];
        shape.lineTo(cx, -cy);
        break;
      case "C":
        shape.bezierCurveTo(
          cmd.values[0],
          -cmd.values[1],
          cmd.values[2],
          -cmd.values[3],
          cmd.values[4],
          -cmd.values[5],
        );
        cx = cmd.values[4];
        cy = cmd.values[5];
        break;
      case "Q":
        shape.quadraticCurveTo(
          cmd.values[0],
          -cmd.values[1],
          cmd.values[2],
          -cmd.values[3],
        );
        cx = cmd.values[2];
        cy = cmd.values[3];
        break;
      case "Z":
        cx = startX;
        cy = startY;
        shape.closePath();
        break;
    }
  }

  return shape;
}

interface SimpleCommand {
  type: string;
  values: number[];
}

/**
 * SVG path parser - handles M, L, C, Q, S, T, A, H, V, Z commands
 * (both absolute and relative). Converts everything to absolute M/L/C/Q/Z.
 */
function parseDToCommands(d: string): SimpleCommand[] {
  const commands: SimpleCommand[] = [];
  const regex = /([MLCQSTAHVZmlcqstahvz])\s*([-\d.,\s]*)/g;
  let match;
  let cx = 0,
    cy = 0;
  let startX = 0,
    startY = 0;
  // Track last control points for smooth curve continuity
  let lastCubicCp: { x: number; y: number } | null = null;
  let lastQuadCp: { x: number; y: number } | null = null;

  while ((match = regex.exec(d)) !== null) {
    const type = match[1];
    const nums = match[2].trim()
      ? match[2]
          .trim()
          .split(/[\s,]+/)
          .map(Number)
      : [];

    // Reset control point tracking for non-curve commands
    if (!"CcSsQqTt".includes(type)) {
      lastCubicCp = null;
      lastQuadCp = null;
    }

    switch (type) {
      case "M":
        for (let i = 0; i < nums.length; i += 2) {
          cx = nums[i];
          cy = nums[i + 1];
          if (i === 0) {
            startX = cx;
            startY = cy;
          }
          commands.push({ type: i === 0 ? "M" : "L", values: [cx, cy] });
        }
        break;
      case "m":
        for (let i = 0; i < nums.length; i += 2) {
          cx += nums[i];
          cy += nums[i + 1];
          if (i === 0) {
            startX = cx;
            startY = cy;
          }
          commands.push({ type: i === 0 ? "M" : "L", values: [cx, cy] });
        }
        break;
      case "L":
        for (let i = 0; i < nums.length; i += 2) {
          cx = nums[i];
          cy = nums[i + 1];
          commands.push({ type: "L", values: [cx, cy] });
        }
        break;
      case "l":
        for (let i = 0; i < nums.length; i += 2) {
          cx += nums[i];
          cy += nums[i + 1];
          commands.push({ type: "L", values: [cx, cy] });
        }
        break;
      case "H":
        for (const n of nums) {
          cx = n;
          commands.push({ type: "L", values: [cx, cy] });
        }
        break;
      case "h":
        for (const n of nums) {
          cx += n;
          commands.push({ type: "L", values: [cx, cy] });
        }
        break;
      case "V":
        for (const n of nums) {
          cy = n;
          commands.push({ type: "L", values: [cx, cy] });
        }
        break;
      case "v":
        for (const n of nums) {
          cy += n;
          commands.push({ type: "L", values: [cx, cy] });
        }
        break;
      case "C":
        for (let i = 0; i < nums.length; i += 6) {
          commands.push({ type: "C", values: nums.slice(i, i + 6) });
          lastCubicCp = { x: nums[i + 2], y: nums[i + 3] };
          cx = nums[i + 4];
          cy = nums[i + 5];
        }
        break;
      case "c":
        for (let i = 0; i < nums.length; i += 6) {
          const abs = [
            cx + nums[i],
            cy + nums[i + 1],
            cx + nums[i + 2],
            cy + nums[i + 3],
            cx + nums[i + 4],
            cy + nums[i + 5],
          ];
          commands.push({ type: "C", values: abs });
          lastCubicCp = { x: abs[2], y: abs[3] };
          cx = abs[4];
          cy = abs[5];
        }
        break;
      case "S": {
        for (let i = 0; i < nums.length; i += 4) {
          // Reflect last cubic control point across current point
          const cp1x = lastCubicCp ? 2 * cx - lastCubicCp.x : cx;
          const cp1y = lastCubicCp ? 2 * cy - lastCubicCp.y : cy;
          const cp2x = nums[i];
          const cp2y = nums[i + 1];
          const endX = nums[i + 2];
          const endY = nums[i + 3];
          commands.push({
            type: "C",
            values: [cp1x, cp1y, cp2x, cp2y, endX, endY],
          });
          lastCubicCp = { x: cp2x, y: cp2y };
          cx = endX;
          cy = endY;
        }
        break;
      }
      case "s": {
        for (let i = 0; i < nums.length; i += 4) {
          const cp1x = lastCubicCp ? 2 * cx - lastCubicCp.x : cx;
          const cp1y = lastCubicCp ? 2 * cy - lastCubicCp.y : cy;
          const cp2x = cx + nums[i];
          const cp2y = cy + nums[i + 1];
          const endX = cx + nums[i + 2];
          const endY = cy + nums[i + 3];
          commands.push({
            type: "C",
            values: [cp1x, cp1y, cp2x, cp2y, endX, endY],
          });
          lastCubicCp = { x: cp2x, y: cp2y };
          cx = endX;
          cy = endY;
        }
        break;
      }
      case "Q":
        for (let i = 0; i < nums.length; i += 4) {
          commands.push({ type: "Q", values: nums.slice(i, i + 4) });
          lastQuadCp = { x: nums[i], y: nums[i + 1] };
          cx = nums[i + 2];
          cy = nums[i + 3];
        }
        break;
      case "q":
        for (let i = 0; i < nums.length; i += 4) {
          const abs = [
            cx + nums[i],
            cy + nums[i + 1],
            cx + nums[i + 2],
            cy + nums[i + 3],
          ];
          commands.push({ type: "Q", values: abs });
          lastQuadCp = { x: abs[0], y: abs[1] };
          cx = abs[2];
          cy = abs[3];
        }
        break;
      case "T": {
        for (let i = 0; i < nums.length; i += 2) {
          // Reflect last quadratic control point across current point
          const cpx: number = lastQuadCp ? 2 * cx - lastQuadCp.x : cx;
          const cpy: number = lastQuadCp ? 2 * cy - lastQuadCp.y : cy;
          const endX = nums[i];
          const endY = nums[i + 1];
          commands.push({ type: "Q", values: [cpx, cpy, endX, endY] });
          lastQuadCp = { x: cpx, y: cpy };
          cx = endX;
          cy = endY;
        }
        break;
      }
      case "t": {
        for (let i = 0; i < nums.length; i += 2) {
          const cpx: number = lastQuadCp ? 2 * cx - lastQuadCp.x : cx;
          const cpy: number = lastQuadCp ? 2 * cy - lastQuadCp.y : cy;
          const endX = cx + nums[i];
          const endY = cy + nums[i + 1];
          commands.push({ type: "Q", values: [cpx, cpy, endX, endY] });
          lastQuadCp = { x: cpx, y: cpy };
          cx = endX;
          cy = endY;
        }
        break;
      }
      case "A":
        // Approximate arcs as straight lines to endpoint (acceptable for 3D extrusion)
        for (let i = 0; i < nums.length; i += 7) {
          cx = nums[i + 5];
          cy = nums[i + 6];
          commands.push({ type: "L", values: [cx, cy] });
        }
        break;
      case "a":
        for (let i = 0; i < nums.length; i += 7) {
          cx += nums[i + 5];
          cy += nums[i + 6];
          commands.push({ type: "L", values: [cx, cy] });
        }
        break;
      case "Z":
      case "z":
        commands.push({ type: "Z", values: [] });
        cx = startX;
        cy = startY;
        break;
    }
  }

  return commands;
}

/**
 * Extract the first path d-attribute from an SVG string.
 */
export function extractPathFromSvg(svgString: string): string {
  const match = svgString.match(/<path[^>]*\bd="([^"]+)"/i);
  return match ? match[1] : "";
}
