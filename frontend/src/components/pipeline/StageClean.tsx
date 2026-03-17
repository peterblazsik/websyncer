import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { TraceStageOutput, CleanStageOutput } from "../../types/pipeline";
import {
  cleanSvg,
  DEFAULT_CLEAN_OPTIONS,
} from "../../lib/pipeline/cleanEngine";
import type { CleanOptions } from "../../lib/pipeline/cleanEngine";
import { usePersistedState } from "../../hooks/usePersistedState";
import { SvgPreview } from "./SvgPreview";

interface StageCleanProps {
  traceOutput: TraceStageOutput;
  cleanOutput: CleanStageOutput | null;
  onCleanComplete: (output: CleanStageOutput) => void;
  onZoneSuggestion?: (result: {
    suggestedCuts: any[];
    suggestedZones: any[];
  }) => void;
  productType?: string;
  onBack: () => void;
  onNext: () => void;
}

export function StageClean({
  traceOutput,
  cleanOutput,
  onCleanComplete,
  onZoneSuggestion,
  productType,
  onBack,
  onNext,
}: StageCleanProps) {
  const [options, setOptions] = usePersistedState<CleanOptions>(
    "pipeline-clean-options",
    DEFAULT_CLEAN_OPTIONS,
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Render the cleaned SVG to a small PNG and send to Gemini for zone suggestions
  const suggestZones = useCallback(
    async (svgString: string) => {
      if (!onZoneSuggestion || !productType) return;
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgString, "image/svg+xml");
        const svgEl = doc.querySelector("svg");
        if (!svgEl) return;

        const width = parseInt(svgEl.getAttribute("width") || "280");
        const height = parseInt(svgEl.getAttribute("height") || "410");

        // Render SVG to a small canvas for the API call
        const canvas = document.createElement("canvas");
        const scale = 300 / width;
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const img = new Image();
        const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(svgBlob);

        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to render SVG"));
          };
          img.src = url;
        });

        const base64 = canvas.toDataURL("image/png");
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8787";
        const response = await fetch(`${apiUrl}/api/suggest-zones`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: base64,
            productType,
            viewBox: { width, height },
          }),
        });

        if (!response.ok) return;
        const data = await response.json();
        if (data.success) {
          onZoneSuggestion({
            suggestedCuts: data.suggestedCuts || [],
            suggestedZones: data.suggestedZones || [],
          });
          toast.info("AI refined zone positions from outline");
        }
      } catch {
        // Silent fail — zone suggestion is optional enhancement
      }
    },
    [onZoneSuggestion, productType],
  );

  const runClean = useCallback(() => {
    setIsProcessing(true);
    // Defer to next tick for UI update
    requestAnimationFrame(() => {
      try {
        const result = cleanSvg(traceOutput.svg, options);
        onCleanComplete(result);
        // Fire-and-forget: ask Gemini to refine zone positions from the cleaned outline
        suggestZones(result.svg).catch(() => {});
        toast.success(
          `Cleaned: ${result.pathCount} paths kept, ${result.removedCount} removed`,
        );
      } catch (err) {
        toast.error(
          `Clean failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      } finally {
        setIsProcessing(false);
      }
    });
  }, [traceOutput.svg, options, onCleanComplete, suggestZones]);

  // Auto-clean on mount and whenever options change
  useEffect(() => {
    runClean();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  const updateOption = <K extends keyof CleanOptions>(
    key: K,
    value: CleanOptions[K],
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Preview */}
      <div className="flex-1 min-h-[200px] border-b lg:border-b-0 lg:border-r border-brand-border">
        <SvgPreview
          svgString={cleanOutput?.svg ?? traceOutput.svg}
          emptyMessage="Processing..."
        />
      </div>

      {/* Controls */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col bg-brand-card overflow-y-auto max-h-[40vh] lg:max-h-none">
        <div className="p-4 space-y-4">
          <h3 className="form-label">Clean Options</h3>

          {/* Area threshold */}
          <div>
            <label className="form-label">
              Min Area: {options.minAreaThreshold}
            </label>
            <input
              type="range"
              min={0}
              max={2000}
              step={10}
              value={options.minAreaThreshold}
              onChange={(e) =>
                updateOption("minAreaThreshold", parseInt(e.target.value))
              }
              className="w-full"
            />
            <p className="text-xs text-brand-muted mt-1">
              Paths smaller than this are removed as artifacts
            </p>
          </div>

          {/* Remove holes */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={options.removeHoles}
              onChange={(e) => updateOption("removeHoles", e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-brand-text">
              Remove holes (keep outline only)
            </span>
          </label>

          {/* Target viewBox */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="form-label">Width</label>
              <input
                type="number"
                value={options.targetWidth}
                onChange={(e) =>
                  updateOption("targetWidth", parseInt(e.target.value) || 280)
                }
                className="form-input text-sm"
              />
            </div>
            <div>
              <label className="form-label">Height</label>
              <input
                type="number"
                value={options.targetHeight}
                onChange={(e) =>
                  updateOption("targetHeight", parseInt(e.target.value) || 410)
                }
                className="form-input text-sm"
              />
            </div>
          </div>

          {/* Padding */}
          <div>
            <label className="form-label">Padding: {options.padding}px</label>
            <input
              type="range"
              min={0}
              max={40}
              value={options.padding}
              onChange={(e) =>
                updateOption("padding", parseInt(e.target.value))
              }
              className="w-full"
            />
          </div>

          {/* Stats */}
          <div className="text-xs text-brand-muted space-y-1 pt-2 border-t border-brand-border">
            <p>Source paths: {traceOutput.pathCount}</p>
            {cleanOutput && (
              <>
                <p>Remaining: {cleanOutput.pathCount}</p>
                <p>Removed: {cleanOutput.removedCount}</p>
                <p>
                  ViewBox: {cleanOutput.viewBox.width}x
                  {cleanOutput.viewBox.height}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto p-4 border-t border-brand-border space-y-2">
          <button
            type="button"
            onClick={runClean}
            disabled={isProcessing}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
            {isProcessing ? "Cleaning..." : "Re-Clean"}
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
              disabled={!cleanOutput}
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
