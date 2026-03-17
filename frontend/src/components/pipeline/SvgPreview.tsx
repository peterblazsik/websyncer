import { useState, useRef, useCallback, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface SvgPreviewProps {
  svgString: string | null;
  sourceUrl?: string | null;
  overlay?: React.ReactNode;
  emptyMessage?: string;
}

export function SvgPreview({
  svgString,
  sourceUrl,
  overlay,
  emptyMessage = "No content to display",
}: SvgPreviewProps) {
  const [zoom, setZoom] = useState(1);
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

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  useEffect(() => {
    const handleGlobalUp = () => setIsPanning(false);
    window.addEventListener("mouseup", handleGlobalUp);
    return () => window.removeEventListener("mouseup", handleGlobalUp);
  }, []);

  const hasContent = svgString || sourceUrl;

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
        {/* Checkerboard */}
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

        {hasContent && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center",
            }}
          >
            {svgString ? (
              <div
                className="relative"
                style={{ width: "60vh", maxWidth: "80%" }}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: svgString }}
                  style={{ width: "100%", height: "100%" }}
                  className="[&>svg]:w-full [&>svg]:h-auto"
                />
                {overlay}
              </div>
            ) : sourceUrl ? (
              <img
                src={sourceUrl}
                alt="Source"
                className="max-w-full max-h-full object-contain opacity-50"
                draggable={false}
              />
            ) : null}
          </div>
        )}

        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-brand-muted">{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
