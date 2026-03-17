import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type {
  CleanStageOutput,
  ZoneSplitStageOutput,
  ProductConfig,
  ClassificationResult,
  ZoneSuggestion,
} from "../../types/pipeline";
import {
  splitIntoZones,
  buildZoneSplitSvg,
} from "../../lib/pipeline/zoneSplitEngine";
import {
  getProductList,
  getProductConfig,
} from "../../lib/pipeline/productConfigs";
import { usePersistedState } from "../../hooks/usePersistedState";
import { SvgPreview } from "./SvgPreview";
import { OutlineControls } from "./OutlineControls";

interface StageZoneSplitProps {
  cleanOutput: CleanStageOutput;
  zoneSplitOutput: ZoneSplitStageOutput | null;
  classificationResult?: ClassificationResult | null;
  zoneSuggestion?: ZoneSuggestion | null;
  onZoneSplitComplete: (output: ZoneSplitStageOutput) => void;
  onBack: () => void;
  onNext: () => void;
}

export function StageZoneSplit({
  cleanOutput,
  zoneSplitOutput,
  classificationResult,
  zoneSuggestion,
  onZoneSplitComplete,
  onBack,
  onNext,
}: StageZoneSplitProps) {
  const products = getProductList();
  const [selectedProduct, setSelectedProduct] = usePersistedState(
    "pipeline-product",
    products[0]?.id ?? "sock",
  );
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customCuts, setCustomCuts] = useState<number[] | null>(null);
  const [showOutline, setShowOutline] = usePersistedState(
    "pipeline-show-outline",
    true,
  );
  const [strokeWidth, setStrokeWidth] = usePersistedState(
    "pipeline-stroke-width",
    1.5,
  );

  const config = getProductConfig(selectedProduct);

  const getActiveConfig = useCallback((): ProductConfig | undefined => {
    if (!config) return undefined;
    if (!customCuts) return config;
    return {
      ...config,
      cuts: config.cuts.map((cut, i) => ({
        ...cut,
        position: customCuts[i] ?? cut.position,
      })),
      zoneAssignment: buildZoneAssignment(config, customCuts),
    };
  }, [config, customCuts]);

  const runSplit = useCallback(() => {
    const activeConfig = getActiveConfig();
    if (!activeConfig) return;

    setIsProcessing(true);
    requestAnimationFrame(() => {
      try {
        const result = splitIntoZones(cleanOutput, activeConfig);
        onZoneSplitComplete(result);
        toast.success(`Split into ${result.zonePaths.length} zones`);
      } catch (err) {
        toast.error(
          `Zone split failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      } finally {
        setIsProcessing(false);
      }
    });
  }, [getActiveConfig, cleanOutput, onZoneSplitComplete]);

  // Auto-split on mount and when cuts change
  useEffect(() => {
    runSplit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customCuts, selectedProduct]);

  // Auto-select product from AI classification
  useEffect(() => {
    if (!classificationResult) return;
    const { productType } = classificationResult;
    if (getProductConfig(productType)) {
      setSelectedProduct(productType);
      if (classificationResult.suggestedCuts?.length) {
        const productConfig = getProductConfig(productType)!;
        // Map suggested cuts to the config's cuts array, matching by axis and proximity
        const newCuts = productConfig.cuts.map((cut) => {
          const suggested = classificationResult.suggestedCuts?.find(
            (s) =>
              s.axis === cut.axis && Math.abs(s.position - cut.position) < 100,
          );
          return suggested?.position ?? cut.position;
        });
        setCustomCuts(newCuts);
      }
    }
    // Only run when classification result changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classificationResult]);

  // Apply AI zone suggestion from cleaned outline — takes priority over classification
  // because it analyzes the actual shape rather than the raw photo
  useEffect(() => {
    if (!zoneSuggestion?.suggestedCuts?.length) return;
    const productConfig = getProductConfig(selectedProduct);
    if (!productConfig) return;

    const newCuts = productConfig.cuts.map((cut) => {
      const suggested = zoneSuggestion.suggestedCuts.find(
        (s) => s.axis === cut.axis && Math.abs(s.position - cut.position) < 150,
      );
      return suggested?.position ?? cut.position;
    });
    setCustomCuts(newCuts);
    toast.info("Zone positions refined by AI outline analysis");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneSuggestion]);

  // Build preview SVG using clipPath approach
  const previewSvg = zoneSplitOutput
    ? buildZoneSplitSvg(zoneSplitOutput, cleanOutput.svg, {
        showOutline,
        strokeWidth,
      })
    : cleanOutput.svg;

  const activeConfig = getActiveConfig();

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Preview */}
      <div className="flex-1 min-h-[200px] border-b lg:border-b-0 lg:border-r border-brand-border">
        <SvgPreview
          svgString={previewSvg}
          emptyMessage="Select product and run split"
        />
      </div>

      {/* Controls */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col bg-brand-card overflow-y-auto max-h-[40vh] lg:max-h-none">
        <div className="p-4 space-y-4">
          <h3 className="form-label">Product Configuration</h3>

          {/* Product selector */}
          <div>
            <div className="flex items-center gap-2">
              <label className="form-label">Product</label>
              {classificationResult &&
                classificationResult.productType === selectedProduct && (
                  <span className="text-xs text-green-400">
                    AI detected (
                    {Math.round(classificationResult.confidence * 100)}%)
                  </span>
                )}
            </div>
            <select
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                setCustomCuts(null);
              }}
              className="form-select text-sm"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cut line positions */}
          {activeConfig && (
            <div className="space-y-3">
              <label className="form-label">Cut Positions</label>
              {activeConfig.cuts.map((cut, i) => {
                const value = customCuts?.[i] ?? cut.position;
                const max =
                  cut.axis === "horizontal"
                    ? activeConfig.viewBox.height
                    : activeConfig.viewBox.width;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs text-brand-muted mb-1">
                      <span>{cut.label}</span>
                      <span>{value}px</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={max}
                      value={value}
                      onChange={(e) => {
                        const newCuts = customCuts
                          ? [...customCuts]
                          : (config?.cuts.map((c) => c.position) ?? []);
                        newCuts[i] = parseInt(e.target.value);
                        setCustomCuts(newCuts);
                      }}
                      className="w-full"
                    />
                  </div>
                );
              })}
              {customCuts && (
                <button
                  type="button"
                  onClick={() => setCustomCuts(null)}
                  className="text-xs text-brand-muted hover:text-white transition-colors"
                >
                  Reset to defaults
                </button>
              )}
            </div>
          )}

          {/* Zone list */}
          {activeConfig && (
            <div className="space-y-1">
              <label className="form-label">Zones</label>
              {activeConfig.zones.map((zone) => {
                return (
                  <div
                    key={zone.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                      hoveredZone === zone.id
                        ? "bg-white/10"
                        : "hover:bg-white/5"
                    }`}
                    onMouseEnter={() => setHoveredZone(zone.id)}
                    onMouseLeave={() => setHoveredZone(null)}
                  >
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: zone.color }}
                    />
                    <span className="text-brand-text">{zone.label}</span>
                    <span className="ml-auto text-brand-muted">&#10003;</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Outline controls */}
          <OutlineControls
            showOutline={showOutline}
            onShowOutlineChange={setShowOutline}
            strokeWidth={strokeWidth}
            onStrokeWidthChange={setStrokeWidth}
          />
        </div>

        {/* Actions */}
        <div className="mt-auto p-4 border-t border-brand-border space-y-2">
          <button
            type="button"
            onClick={runSplit}
            disabled={isProcessing || !config}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
            {isProcessing ? "Splitting..." : "Re-Split"}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onBack}
              className="btn-secondary flex-1"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!zoneSplitOutput}
              className="btn-secondary flex-1"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Rebuilds zone assignment from custom cut positions.
 * Works for both horizontal-only products (sock, insole, shoe, bottle)
 * and mixed-axis products (t-shirt) by mapping each cut back to
 * the zone boundaries it originally defined.
 */
function buildZoneAssignment(
  config: ProductConfig,
  customCuts: number[],
): Record<string, { yMin: number; yMax: number; xMin: number; xMax: number }> {
  const result: Record<
    string,
    { yMin: number; yMax: number; xMin: number; xMax: number }
  > = {};

  // Start from the original zone assignment as baseline
  for (const zone of config.zones) {
    const origBounds = config.zoneAssignment[zone.id];
    result[zone.id] = { ...origBounds };
  }

  // Apply each custom cut position by finding which zone boundaries
  // it affects — a cut's original position will match the yMin/yMax
  // or xMin/xMax of adjacent zones
  config.cuts.forEach((cut, i) => {
    const newPos = customCuts[i] ?? cut.position;

    for (const zone of config.zones) {
      const orig = config.zoneAssignment[zone.id];

      if (cut.axis === "horizontal") {
        if (orig.yMin === cut.position) result[zone.id].yMin = newPos;
        if (orig.yMax === cut.position) result[zone.id].yMax = newPos;
      } else {
        if (orig.xMin === cut.position) result[zone.id].xMin = newPos;
        if (orig.xMax === cut.position) result[zone.id].xMax = newPos;
      }
    }
  });

  return result;
}
