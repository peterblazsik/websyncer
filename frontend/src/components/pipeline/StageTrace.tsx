import { useState, useCallback, useEffect, useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { TraceParams } from "../../types/vectorize";
import type {
  TraceStageOutput,
  ClassificationResult,
} from "../../types/pipeline";
import { DEFAULT_PARAMS } from "../../types/vectorize";
import { traceImage, loadImageFromFile } from "../../lib/vectorizeEngine";
import { usePersistedState } from "../../hooks/usePersistedState";
import { SvgPreview } from "./SvgPreview";

// Product photo preset: optimized for product photography
const PRODUCT_PHOTO_PRESET: Partial<TraceParams> = {
  mode: "bw",
  turdSize: 4,
  alphaMax: 1,
  optTolerance: 0.2,
  threshold: 128,
};

interface StageTraceProps {
  sourceImage: HTMLImageElement | null;
  sourceUrl: string | null;
  traceOutput: TraceStageOutput | null;
  onImageLoaded: (img: HTMLImageElement, url: string) => void;
  onTraceComplete: (output: TraceStageOutput) => void;
  onClassify?: (result: ClassificationResult) => void;
  onNext: () => void;
}

export function StageTrace({
  sourceImage,
  sourceUrl,
  traceOutput,
  onImageLoaded,
  onTraceComplete,
  onClassify,
  onNext,
}: StageTraceProps) {
  const [params, setParams] = usePersistedState<TraceParams>(
    "pipeline-trace-params",
    { ...DEFAULT_PARAMS, ...PRODUCT_PHOTO_PRESET },
  );
  const [isTracing, setIsTracing] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const classifyProduct = useCallback(
    async (file: File) => {
      setIsClassifying(true);
      try {
        const base64 = await fileToBase64(file);
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8787";
        const response = await fetch(`${apiUrl}/api/classify-product`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });
        if (!response.ok) return;
        const data = await response.json();
        if (data.success && data.productType !== "unknown") {
          onClassify?.({
            productType: data.productType,
            confidence: data.confidence,
            suggestedCuts: data.suggestedCuts,
            suggestedZones: data.suggestedZones,
          });
          toast.info(
            `Detected: ${data.productType} (${Math.round(data.confidence * 100)}%)`,
          );
        }
      } catch {
        // Silent fail — classification is optional enhancement
      } finally {
        setIsClassifying(false);
      }
    },
    [onClassify],
  );

  const handleFileSelect = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      try {
        const img = await loadImageFromFile(files[0]);
        const url = URL.createObjectURL(files[0]);
        onImageLoaded(img, url);
        toast.success(`Image loaded: ${img.naturalWidth}x${img.naturalHeight}`);

        // Fire classification in background (non-blocking)
        classifyProduct(files[0]).catch(() => {});
      } catch {
        toast.error("Failed to load image");
      }
    },
    [onImageLoaded, classifyProduct],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/"),
      );
      handleFileSelect(files);
    },
    [handleFileSelect],
  );

  const runTrace = useCallback(async () => {
    if (!sourceImage || isTracing) return;
    setIsTracing(true);
    try {
      const result = await traceImage(sourceImage, params, true);
      onTraceComplete({
        svg: result.svg,
        params,
        width: result.width,
        height: result.height,
        pathCount: result.pathCount,
      });
    } catch (err) {
      toast.error(
        `Trace failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setIsTracing(false);
    }
  }, [sourceImage, params, onTraceComplete, isTracing]);

  // Auto-retrace on param change (debounced 300ms)
  useEffect(() => {
    if (!sourceImage) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runTrace();
    }, 300);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, sourceImage]);

  const updateParam = <K extends keyof TraceParams>(
    key: K,
    value: TraceParams[K],
  ) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Preview */}
      <div
        className={`flex-1 min-h-[200px] border-b lg:border-b-0 lg:border-r border-brand-border ${
          !sourceImage ? "flex items-center justify-center" : ""
        } transition-colors ${isDragOver ? "bg-white/5 border-white/30" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          setIsDragOver(false);
          handleDrop(e);
        }}
      >
        {sourceImage ? (
          <SvgPreview
            svgString={traceOutput?.svg ?? null}
            sourceUrl={sourceUrl}
            emptyMessage="Adjusting parameters will auto-trace"
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {isDragOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/5 z-10">
                <span className="text-white text-lg font-medium">
                  Release to upload
                </span>
              </div>
            )}
            <label className="drop-zone max-w-md cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleFileSelect(Array.from(e.target.files || []))
                }
              />
              <Upload className="w-12 h-12 text-brand-muted mx-auto mb-4" />
              <div className="text-white font-medium mb-2">
                Drop product photo or click to browse
              </div>
              <div className="text-brand-muted text-sm">
                PNG, JPG, WebP supported
              </div>
              <div className="mt-4 w-32 h-32 rounded-lg overflow-hidden opacity-40 border border-brand-border">
                <img
                  src="/assets/generated/pipeline-example.jpg"
                  alt="Example product"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-brand-muted text-xs mt-2">
                Example: product photo
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col bg-brand-card overflow-y-auto max-h-[40vh] lg:max-h-none">
        <div className="p-4 space-y-4">
          <h3 className="form-label">Trace Parameters</h3>

          {/* Threshold */}
          <div>
            <label className="form-label">Threshold: {params.threshold}</label>
            <input
              type="range"
              min={0}
              max={255}
              value={params.threshold}
              onChange={(e) =>
                updateParam("threshold", parseInt(e.target.value))
              }
              className="w-full"
            />
          </div>

          {/* Noise Filter */}
          <div>
            <label className="form-label">
              Noise Filter: {params.turdSize}
            </label>
            <input
              type="range"
              min={0}
              max={20}
              value={params.turdSize}
              onChange={(e) =>
                updateParam("turdSize", parseInt(e.target.value))
              }
              className="w-full"
            />
          </div>

          {/* Corner Threshold */}
          <div>
            <label className="form-label">
              Corners: {params.alphaMax.toFixed(2)}
            </label>
            <input
              type="range"
              min={0}
              max={134}
              value={Math.round(params.alphaMax * 100)}
              onChange={(e) =>
                updateParam("alphaMax", parseInt(e.target.value) / 100)
              }
              className="w-full"
            />
          </div>

          {/* Curve Tolerance */}
          <div>
            <label className="form-label">
              Smoothing: {params.optTolerance.toFixed(2)}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(params.optTolerance * 100)}
              onChange={(e) =>
                updateParam("optTolerance", parseInt(e.target.value) / 100)
              }
              className="w-full"
            />
          </div>

          {/* Invert */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={params.invert}
              onChange={(e) => updateParam("invert", e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-brand-text">Invert</span>
          </label>

          {/* Presets */}
          <div>
            <label className="form-label">Preset</label>
            <button
              type="button"
              onClick={() =>
                setParams({ ...DEFAULT_PARAMS, ...PRODUCT_PHOTO_PRESET })
              }
              className="w-full text-left px-3 py-2 text-xs bg-black border border-brand-border rounded text-brand-text hover:border-white/50 transition-colors"
            >
              Product Photo (recommended)
            </button>
          </div>

          {/* Source info */}
          {sourceImage && (
            <div className="text-xs text-brand-muted space-y-1 pt-2 border-t border-brand-border">
              <p>
                Source: {sourceImage.naturalWidth}x{sourceImage.naturalHeight}
              </p>
              {traceOutput && <p>Paths: {traceOutput.pathCount}</p>}
              {isTracing && (
                <p className="text-[#fa642c] animate-pulse">Tracing...</p>
              )}
              {isClassifying && (
                <p className="text-blue-400 animate-pulse">
                  Classifying product...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-auto p-4 border-t border-brand-border space-y-2">
          <button
            type="button"
            onClick={runTrace}
            disabled={!sourceImage || isTracing}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isTracing && <Loader2 className="w-4 h-4 animate-spin" />}
            {isTracing ? "Tracing..." : "Re-Trace"}
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!traceOutput}
            className="btn-secondary w-full"
          >
            Next: Clean →
          </button>
        </div>
      </div>
    </div>
  );
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
