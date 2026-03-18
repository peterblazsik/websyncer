import { useState, useCallback, useEffect } from "react";
import { Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import type {
  ZoneSplitStageOutput,
  ExportStageOutput,
} from "../../types/pipeline";
import {
  generateExport,
  generateArtinJson,
  type ExportMode,
} from "../../lib/pipeline/exportEngine";
import { downloadFile } from "../../lib/downloadHelpers";
import { usePersistedState } from "../../hooks/usePersistedState";
import { SvgPreview } from "./SvgPreview";
import { OutlineControls } from "./OutlineControls";

interface StageExportProps {
  zoneSplitOutput: ZoneSplitStageOutput;
  cleanSvg: string;
  exportOutput: ExportStageOutput | null;
  onExportComplete: (output: ExportStageOutput) => void;
  onBack: () => void;
  onNext?: () => void;
}

export function StageExport({
  zoneSplitOutput,
  cleanSvg: cleanSvgString,
  exportOutput,
  onExportComplete,
  onBack,
  onNext,
}: StageExportProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [includeOutline, setIncludeOutline] = usePersistedState(
    "pipeline-export-outline",
    true,
  );
  const [strokeWidth, setStrokeWidth] = usePersistedState(
    "pipeline-stroke-width",
    1.5,
  );
  const [exportMode, setExportMode] = usePersistedState<ExportMode>(
    "pipeline-export-mode",
    "template",
  );

  // Auto-generate export on mount and when options change
  useEffect(() => {
    const result = generateExport(zoneSplitOutput, cleanSvgString, {
      includeOutline,
      strokeWidth,
      mode: exportMode,
    });
    onExportComplete(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeOutline, strokeWidth, exportMode]);

  const handleDownloadSvg = useCallback(() => {
    if (!exportOutput) return;
    const blob = new Blob([exportOutput.svg], { type: "image/svg+xml" });
    downloadFile(blob, "product-zones.svg");
    toast.success("SVG downloaded");
  }, [exportOutput]);

  const handleCopySvg = useCallback(async () => {
    if (!exportOutput) return;
    await navigator.clipboard.writeText(exportOutput.svg);
    setCopied("svg");
    toast.success("SVG copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  }, [exportOutput]);

  const handleCopyArtin = useCallback(async () => {
    if (!exportOutput) return;
    const json = generateArtinJson(exportOutput);
    await navigator.clipboard.writeText(json);
    setCopied("artin");
    toast.success("ARTIN JSON copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  }, [exportOutput]);

  const handleDownloadJson = useCallback(() => {
    if (!exportOutput) return;
    const json = generateArtinJson(exportOutput);
    const blob = new Blob([json], { type: "application/json" });
    downloadFile(blob, "product-zones.json");
    toast.success("JSON downloaded");
  }, [exportOutput]);

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Preview */}
      <div className="flex-1 min-h-[200px] border-b lg:border-b-0 lg:border-r border-brand-border">
        <SvgPreview
          svgString={exportOutput?.svg ?? null}
          emptyMessage="Generating export..."
        />
      </div>

      {/* Controls */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col bg-brand-card overflow-y-auto max-h-[40vh] lg:max-h-none">
        <div className="p-4 space-y-4">
          <h3 className="form-label">Export</h3>

          {/* Export mode */}
          <div>
            <label className="form-label">Export Mode</label>
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => setExportMode("template")}
                className={`px-3 py-2 text-xs rounded text-left transition-colors ${
                  exportMode === "template"
                    ? "bg-white text-black font-bold"
                    : "bg-black/30 text-brand-muted hover:text-white border border-brand-border"
                }`}
              >
                Template
                <span className="block text-[10px] mt-0.5 opacity-70">
                  Outline + clipPath only
                </span>
              </button>
              <button
                type="button"
                onClick={() => setExportMode("zones")}
                className={`px-3 py-2 text-xs rounded text-left transition-colors ${
                  exportMode === "zones"
                    ? "bg-white text-black font-bold"
                    : "bg-black/30 text-brand-muted hover:text-white border border-brand-border"
                }`}
              >
                Zones
                <span className="block text-[10px] mt-0.5 opacity-70">
                  Colored zone preview
                </span>
              </button>
            </div>
            <p className="text-[10px] text-brand-muted mt-1.5">
              {exportMode === "template"
                ? "Clean SVG for ARTIN/O_S_v2 — outline as clipPath, zones as invisible metadata. AI designs clip to the product shape."
                : "Colored zones baked into the SVG — for reference and previewing only."}
            </p>
          </div>

          {/* Zone summary */}
          {exportOutput && (
            <div className="space-y-2">
              <label className="form-label">Zones Generated</label>
              {Object.entries(exportOutput.zones).map(([zoneId, d]) => {
                const zone = zoneSplitOutput.productConfig.zones.find(
                  (z) => z.id === zoneId,
                );
                return (
                  <div
                    key={zoneId}
                    className="flex items-center gap-2 px-2 py-1.5 bg-black/30 rounded text-xs"
                  >
                    <div
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{
                        backgroundColor: zone?.color ?? "#666",
                      }}
                    />
                    <span className="text-brand-text">
                      {zone?.label ?? zoneId}
                    </span>
                    <span className="ml-auto text-brand-muted">
                      {d.length} chars
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* SVG size */}
          {exportOutput && (
            <div className="text-xs text-brand-muted pt-2 border-t border-brand-border">
              <p>SVG size: {formatBytes(new Blob([exportOutput.svg]).size)}</p>
              <p>Outline: {exportOutput.outline.length} chars</p>
            </div>
          )}

          {/* Outline controls */}
          <OutlineControls
            showOutline={includeOutline}
            onShowOutlineChange={setIncludeOutline}
            strokeWidth={strokeWidth}
            onStrokeWidthChange={setStrokeWidth}
            label="Include Outline in Export"
          />
        </div>

        {/* Actions */}
        <div className="mt-auto p-4 border-t border-brand-border space-y-2">
          {/* Primary download */}
          <button
            type="button"
            onClick={handleDownloadSvg}
            disabled={!exportOutput}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download SVG
          </button>

          {/* Secondary actions row */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopySvg}
              disabled={!exportOutput}
              className="btn-secondary flex-1 flex items-center justify-center gap-2 text-xs"
            >
              {copied === "svg" ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied === "svg" ? "Copied" : "Copy SVG"}
            </button>
            <button
              type="button"
              onClick={handleDownloadJson}
              disabled={!exportOutput}
              className="btn-secondary flex-1 flex items-center justify-center gap-2 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              JSON
            </button>
            <button
              type="button"
              onClick={handleCopyArtin}
              disabled={!exportOutput}
              className="btn-secondary flex-1 flex items-center justify-center gap-2 text-xs"
            >
              {copied === "artin" ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              ARTIN
            </button>
          </div>

          {/* Navigation */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="btn-secondary flex-1"
            >
              ← Back
            </button>
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                disabled={!exportOutput}
                className="btn-secondary flex-1"
              >
                Next: 3D →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
