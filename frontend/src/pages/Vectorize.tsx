import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { VectorizeCanvas } from "../components/vectorize/VectorizeCanvas";
import { VectorizeControls } from "../components/vectorize/VectorizeControls";
import { VectorizeToolbar } from "../components/vectorize/VectorizeToolbar";
import { loadImageFromFile, traceImage } from "../lib/vectorizeEngine";
import type {
  TraceParams,
  TraceResult,
  HistoryEntry,
} from "../types/vectorize";
import { DEFAULT_PARAMS } from "../types/vectorize";
import { usePersistedState } from "../hooks/usePersistedState";

export function Vectorize() {
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [params, setParams] = usePersistedState<TraceParams>(
    "vectorize-params",
    DEFAULT_PARAMS,
  );
  const [result, setResult] = useState<TraceResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Undo/redo history
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isUndoRedo = useRef(false);

  // Load image when file changes
  const handleFileSelected = useCallback(async (file: File) => {
    try {
      const img = await loadImageFromFile(file);
      const url = URL.createObjectURL(file);

      setSourceFile(file);
      setSourceUrl(url);
      setSourceImage(img);
      setResult(null);
      setHistory([]);
      setHistoryIndex(-1);
    } catch {
      toast.error("Failed to load image");
    }
  }, []);

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = Array.from(e.dataTransfer.files).find((f) =>
        f.type.startsWith("image/"),
      );
      if (file) handleFileSelected(file);
    },
    [handleFileSelected],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelected(file);
      e.target.value = "";
    },
    [handleFileSelected],
  );

  // Trace when params change (debounced)
  useEffect(() => {
    if (!sourceImage) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsProcessing(true);
      try {
        const traceResult = await traceImage(sourceImage, params, true);
        setResult(traceResult);

        // Add to undo history (skip if this was an undo/redo action)
        if (!isUndoRedo.current) {
          setHistory((prev) => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push({ params: { ...params }, timestamp: Date.now() });
            // Keep max 50 entries
            if (newHistory.length > 50) newHistory.shift();
            return newHistory;
          });
          setHistoryIndex((prev) => prev + 1);
        }
        isUndoRedo.current = false;
      } catch (err) {
        toast.error(
          `Trace failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      } finally {
        setIsProcessing(false);
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [sourceImage, params]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle params change from controls
  const handleParamsChange = useCallback(
    (newParams: TraceParams) => {
      setParams(newParams);
    },
    [setParams],
  );

  // Undo/redo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedo.current = true;
      const entry = history[historyIndex - 1];
      setHistoryIndex((prev) => prev - 1);
      setParams(entry.params);
    }
  }, [history, historyIndex, setParams]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedo.current = true;
      const entry = history[historyIndex + 1];
      setHistoryIndex((prev) => prev + 1);
      setParams(entry.params);
    }
  }, [history, historyIndex, setParams]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo, handleRedo]);

  // Full resolution export
  const handleExportFullRes = useCallback(async () => {
    if (!sourceImage) return;
    setIsProcessing(true);
    try {
      const fullResult = await traceImage(sourceImage, params, false);
      setResult(fullResult);
      toast.success("Full resolution trace complete");
    } catch {
      toast.error("Full resolution trace failed");
    } finally {
      setIsProcessing(false);
    }
  }, [sourceImage, params]);

  // Clear source
  const handleClear = useCallback(() => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    setSourceFile(null);
    setSourceUrl(null);
    setSourceImage(null);
    setResult(null);
    setHistory([]);
    setHistoryIndex(-1);
  }, [sourceUrl]);

  return (
    <main className="h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
        <div>
          <h1 className="text-lg font-bold text-white uppercase tracking-tight">
            Image Vectorizer
          </h1>
          <p className="text-xs text-brand-muted">
            Convert raster images to clean SVG vector graphics
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sourceFile && (
            <>
              <span className="text-xs text-brand-muted truncate max-w-48">
                {sourceFile.name}
              </span>
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-brand-muted hover:text-white transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
          {historyIndex > 0 && (
            <span className="text-xs text-brand-muted">
              Undo: Cmd+Z | Redo: Cmd+Shift+Z
            </span>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Upload zone (shown when no image) or source thumbnail */}
        {!sourceFile ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div
              className={`drop-zone max-w-lg w-full ${isDragging ? "dragover" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleInputChange}
                className="hidden"
              />
              <Upload className="w-12 h-12 text-brand-muted mx-auto mb-4" />
              <div className="text-white font-medium mb-2">
                Drop image here or click to browse
              </div>
              <div className="text-brand-muted text-sm">
                PNG, JPG, WebP supported
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Center: SVG Preview */}
            <div className="flex-1 flex flex-col min-w-0">
              <VectorizeCanvas
                sourceUrl={sourceUrl}
                svgString={result?.svg ?? null}
                isProcessing={isProcessing}
                pathCount={result?.pathCount ?? 0}
                nodeCount={result?.nodeCount ?? 0}
                dimensions={
                  result ? { width: result.width, height: result.height } : null
                }
              />

              {/* Bottom toolbar */}
              <VectorizeToolbar
                svgString={result?.svg ?? null}
                dimensions={
                  result ? { width: result.width, height: result.height } : null
                }
                disabled={isProcessing}
              />
            </div>

            {/* Right: Controls */}
            <div className="w-72 border-l border-brand-border overflow-y-auto bg-brand-card p-4">
              {/* Full resolution export button */}
              <button
                type="button"
                onClick={handleExportFullRes}
                disabled={isProcessing || !sourceImage}
                className="btn-primary w-full !py-2 text-sm mb-4"
              >
                {isProcessing ? "Processing..." : "Trace Full Resolution"}
              </button>

              {/* Upload new image */}
              <div className="mb-4">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="btn-secondary w-full !py-2 !border text-sm"
                >
                  Change Image
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </div>

              <div className="w-full h-px bg-brand-border mb-4" />

              <VectorizeControls
                params={params}
                onChange={handleParamsChange}
                disabled={isProcessing}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
