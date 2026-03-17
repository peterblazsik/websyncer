import type {
  ZoneSplitStageOutput,
  ExportStageOutput,
} from "../../types/pipeline";
import { buildMaskedSvg } from "./svgMaskBuilder";

/**
 * Stage 4: Generate final export SVG using mask for clipping.
 */
export function generateExport(
  splitOutput: ZoneSplitStageOutput,
  cleanSvg: string,
  options?: { includeOutline?: boolean; strokeWidth?: number },
): ExportStageOutput {
  const config = splitOutput.productConfig;
  const svg = buildMaskedSvg(config, cleanSvg, {
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

export function generateArtinJson(output: ExportStageOutput): string {
  return JSON.stringify(
    { outline: output.outline, zones: output.zones },
    null,
    2,
  );
}
