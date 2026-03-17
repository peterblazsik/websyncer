import type {
  ProductConfig,
  ZonePath,
  ZoneSplitStageOutput,
  CleanStageOutput,
} from "../../types/pipeline";
import { extractPathFromSvg } from "./meshEngine";
import { buildMaskedSvg } from "./svgMaskBuilder";

/**
 * Stage 3: Split outline into zones.
 */
export function splitIntoZones(
  cleanOutput: CleanStageOutput,
  config: ProductConfig,
): ZoneSplitStageOutput {
  const outlinePath = extractPathFromSvg(cleanOutput.svg);

  const zonePaths: ZonePath[] = config.zones.map((zone) => {
    const bounds = config.zoneAssignment[zone.id];
    if (!bounds) return { zoneId: zone.id, d: "", segments: [] };
    const d = `M${bounds.xMin},${bounds.yMin} L${bounds.xMax},${bounds.yMin} L${bounds.xMax},${bounds.yMax} L${bounds.xMin},${bounds.yMax} Z`;
    return { zoneId: zone.id, d, segments: [] };
  });

  return { zonePaths, outlinePath, productConfig: config };
}

/**
 * Build zone split preview SVG using <mask> for reliable clipping.
 * White areas in mask = visible, black = hidden.
 */
export function buildZoneSplitSvg(
  splitOutput: ZoneSplitStageOutput,
  cleanSvg: string,
  options?: { showOutline?: boolean; strokeWidth?: number },
): string {
  return buildMaskedSvg(splitOutput.productConfig, cleanSvg, {
    showOutline: options?.showOutline ?? true,
    strokeWidth: options?.strokeWidth ?? 1.5,
    includeCutLines: true,
    zoneOpacity: 0.8,
  });
}
