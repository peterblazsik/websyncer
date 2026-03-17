import type { ProductConfig } from "../../types/pipeline";

export interface MaskedSvgOptions {
  showOutline?: boolean;
  strokeWidth?: number;
  includeIds?: boolean;
  includeCutLines?: boolean;
  zoneOpacity?: number;
}

/**
 * Build an SVG with zone colors masked by the product outline shape.
 * Shared logic between zone split preview and export generation.
 */
export function buildMaskedSvg(
  config: ProductConfig,
  cleanSvg: string,
  options: MaskedSvgOptions = {},
): string {
  const {
    showOutline = true,
    strokeWidth = 1.5,
    includeIds = false,
    includeCutLines = false,
    zoneOpacity,
  } = options;
  const { width, height } = config.viewBox;

  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanSvg, "image/svg+xml");
  const svgEl = doc.querySelector("svg");
  if (!svgEl) return cleanSvg;

  const innerContent = svgEl.innerHTML;
  const maskContent = innerContent
    .replace(/\bfill="[^"]*"/g, 'fill="white"')
    .replace(/\bfill:[^;"]+/g, "fill:white");

  const maskId = includeIds ? "product-mask" : "zone-mask";

  const zoneRects = config.zones
    .map((zone) => {
      const bounds = config.zoneAssignment[zone.id];
      if (!bounds) return "";
      const idAttr = includeIds ? ` id="zone-${zone.id}"` : "";
      const opacityAttr =
        zoneOpacity != null ? ` opacity="${zoneOpacity}"` : "";
      return `    <rect${idAttr} x="${bounds.xMin}" y="${bounds.yMin}" width="${bounds.xMax - bounds.xMin}" height="${bounds.yMax - bounds.yMin}" fill="${zone.color}"${opacityAttr}/>`;
    })
    .join("\n");

  const cutLines = includeCutLines
    ? config.cuts
        .map((cut) => {
          if (cut.axis === "horizontal") {
            return `    <line x1="0" y1="${cut.position}" x2="${width}" y2="${cut.position}" stroke="white" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.6"/>`;
          }
          return `    <line x1="${cut.position}" y1="0" x2="${cut.position}" y2="${height}" stroke="white" stroke-width="0.5" stroke-dasharray="4,4" opacity="0.6"/>`;
        })
        .join("\n")
    : "";

  let outlineGroup = "";
  if (showOutline) {
    const outlineContent = innerContent
      .replace(/\bfill="[^"]*"/g, 'fill="none"')
      .replace(/\bfill:[^;"]+/g, "fill:none");
    const idAttr = includeIds ? ' id="outline"' : "";
    outlineGroup = `\n  <g${idAttr} fill="none" stroke="currentColor" stroke-width="${strokeWidth}">\n    ${outlineContent}\n  </g>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <mask id="${maskId}">
      <rect width="${width}" height="${height}" fill="black"/>
      ${maskContent}
    </mask>
  </defs>
  <g mask="url(#${maskId})">
${zoneRects}
${cutLines}
  </g>${outlineGroup}
</svg>`;
}
