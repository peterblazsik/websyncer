import type {
  ZoneSplitStageOutput,
  ExportStageOutput,
} from "../../types/pipeline";
import { buildMaskedSvg } from "./svgMaskBuilder";

export type ExportMode = "zones" | "template";

interface ExportOptions {
  includeOutline?: boolean;
  strokeWidth?: number;
  mode?: ExportMode;
}

/**
 * Stage 4: Generate final export SVG.
 *
 * Two modes:
 * - "zones": Colored zone rectangles masked to the product shape (preview/reference)
 * - "template": Clean outline with clipPath only — no zone colors.
 *   This is what O_S_v2/ARTIN needs: the outline acts as a clipPath for
 *   AI-generated designs, and zones are invisible metadata (JSON).
 */
export function generateExport(
  splitOutput: ZoneSplitStageOutput,
  cleanSvg: string,
  options?: ExportOptions,
): ExportStageOutput {
  const config = splitOutput.productConfig;
  const mode = options?.mode ?? "zones";

  const svg =
    mode === "template"
      ? buildTemplateSvg(splitOutput, cleanSvg, options)
      : buildMaskedSvg(config, cleanSvg, {
          showOutline: options?.includeOutline ?? true,
          strokeWidth: options?.strokeWidth ?? 1.5,
          includeIds: true,
        });

  const zones: Record<string, string> = {};
  for (const zone of config.zones) {
    const bounds = config.zoneAssignment[zone.id];
    if (bounds) {
      zones[zone.id] =
        `M${bounds.xMin},${bounds.yMin} L${bounds.xMax},${bounds.yMin} L${bounds.xMax},${bounds.yMax} L${bounds.xMin},${bounds.yMax} Z`;
    }
  }

  return { svg, outline: splitOutput.outlinePath, zones };
}

/**
 * Build a clean template SVG for ARTIN/O_S_v2 integration.
 *
 * Structure:
 *   <defs>
 *     <clipPath id="product-clip"> outline path </clipPath>
 *   </defs>
 *   <g id="outline"> stroke-only outline </g>
 *   <!-- Zone boundaries as invisible rects with IDs (display:none) -->
 *   <g id="zones" display="none"> zone rects </g>
 *
 * The consuming app uses the clipPath to clip AI-generated images
 * and reads zone rects programmatically for positioning logic.
 */
function buildTemplateSvg(
  splitOutput: ZoneSplitStageOutput,
  cleanSvg: string,
  options?: ExportOptions,
): string {
  const config = splitOutput.productConfig;
  const { width, height } = config.viewBox;
  const strokeWidth = options?.strokeWidth ?? 1.5;
  const showOutline = options?.includeOutline ?? true;

  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanSvg, "image/svg+xml");
  const svgEl = doc.querySelector("svg");
  if (!svgEl) return cleanSvg;

  const innerContent = svgEl.innerHTML;

  // Build clipPath content (white fill for the outline shape)
  const clipContent = innerContent
    .replace(/\bfill="[^"]*"/g, 'fill="black"')
    .replace(/\bfill:[^;"]+/g, "fill:black");

  // Build outline content (stroke only, no fill)
  // Must also remove stroke="none" that Potrace adds — it overrides the parent's stroke
  const outlineContent = innerContent
    .replace(/\bfill="[^"]*"/g, 'fill="none"')
    .replace(/\bfill:[^;"]+/g, "fill:none")
    .replace(/\bstroke="none"/g, "")
    .replace(/\bstroke:none/g, "");

  // Zone rects — hidden by default, there for programmatic access
  const zoneRects = config.zones
    .map((zone) => {
      const bounds = config.zoneAssignment[zone.id];
      if (!bounds) return "";
      return `    <rect id="zone-${zone.id}" data-label="${zone.label}" data-color="${zone.color}" x="${bounds.xMin}" y="${bounds.yMin}" width="${bounds.xMax - bounds.xMin}" height="${bounds.yMax - bounds.yMin}" fill="none"/>`;
    })
    .join("\n");

  const outlineGroup = showOutline
    ? `\n  <g id="outline" fill="none" stroke="currentColor" stroke-width="${strokeWidth}">\n    ${outlineContent}\n  </g>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <clipPath id="product-clip">
      ${clipContent}
    </clipPath>
  </defs>${outlineGroup}
  <g id="zones" display="none">
${zoneRects}
  </g>
</svg>`;
}

export function generateArtinJson(output: ExportStageOutput): string {
  return JSON.stringify(
    { outline: output.outline, zones: output.zones },
    null,
    2,
  );
}
