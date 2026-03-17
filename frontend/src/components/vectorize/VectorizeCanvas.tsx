import { useState, useRef, useCallback, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff } from "lucide-react";

interface VectorizeCanvasProps {
  sourceUrl: string | null;
  svgString: string | null;
  isProcessing: boolean;
  pathCount: number;
  nodeCount: number;
  dimensions: { width: number; height: number } | null;
}

export function VectorizeCanvas({
  sourceUrl,
  svgString,
  isProcessing,
  pathCount,
  nodeCount,
  dimensions,
}: VectorizeCanvasProps) {
  const [zoom, setZoom] = useState(1);
  const [showOriginal, setShowOriginal] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z * 1.25, 8));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(z / 1.25, 0.25));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Attach wheel listener with { passive: false } to allow preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => Math.max(0.25, Math.min(z * delta, 8)));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        setIsPanning(true);
        panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      }
    },
    [pan],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan({
          x: e.clientX - panStart.current.x,
          y: e.clientY - panStart.current.y,
        });
      }
    },
    [isPanning],
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  useEffect(() => {
    const handleGlobalUp = () => setIsPanning(false);
    window.addEventListener("mouseup", handleGlobalUp);
    return () => window.removeEventListener("mouseup", handleGlobalUp);
  }, []);

  const showContent = sourceUrl || svgString;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-brand-border bg-black/50">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 text-brand-muted hover:text-white transition-colors rounded"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-brand-muted font-mono w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 text-brand-muted hover:text-white transition-colors rounded"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 text-brand-muted hover:text-white transition-colors rounded"
            title="Reset zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-brand-border mx-1" />
          <button
            type="button"
            onClick={() => setShowOriginal((s) => !s)}
            disabled={!sourceUrl || !svgString}
            className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
              showOriginal
                ? "text-white bg-white/10"
                : "text-brand-muted hover:text-white"
            } disabled:opacity-30`}
            title="Toggle original image"
          >
            {showOriginal ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            Original
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-brand-muted">
          {dimensions && (
            <span>
              {dimensions.width} x {dimensions.height}
            </span>
          )}
          {pathCount > 0 && (
            <>
              <span>{pathCount} paths</span>
              <span>{nodeCount} nodes</span>
            </>
          )}
          {isProcessing && (
            <span className="text-[#fa642c] animate-pulse">Tracing...</span>
          )}
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-[#111] relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: isPanning ? "grabbing" : "grab" }}
      >
        {/* Checkerboard pattern for transparency */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #1a1a1a 25%, transparent 25%),
              linear-gradient(-45deg, #1a1a1a 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #1a1a1a 75%),
              linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)
            `,
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
          }}
        />

        {showContent && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center",
            }}
          >
            {/* Show original image */}
            {showOriginal && sourceUrl && (
              <img
                src={sourceUrl}
                alt="Original"
                className="max-w-full max-h-full object-contain"
                style={{ imageRendering: zoom > 2 ? "pixelated" : "auto" }}
                draggable={false}
              />
            )}

            {/* Show SVG result */}
            {!showOriginal && svgString && (
              <div
                className="max-w-full max-h-full"
                dangerouslySetInnerHTML={{ __html: svgString }}
              />
            )}

            {/* Show source when no SVG yet */}
            {!showOriginal && !svgString && sourceUrl && (
              <img
                src={sourceUrl}
                alt="Source"
                className="max-w-full max-h-full object-contain opacity-50"
                draggable={false}
              />
            )}
          </div>
        )}

        {/* Empty state */}
        {!showContent && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-brand-muted">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm">Upload an image to start vectorizing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
