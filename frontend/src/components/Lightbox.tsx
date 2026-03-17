import React, { useState, useEffect, useCallback } from "react";
import { X, Download, Copy, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface LightboxProps {
  imageUrl: string;
  alt?: string;
  onClose: () => void;
  onDownload?: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  imageUrl,
  alt,
  onClose,
  onDownload,
}) => {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z * 1.2, 5));
      if (e.key === "-") setZoom((z) => Math.max(z / 1.2, 0.5));
      if (e.key === "0") {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((z) => Math.min(Math.max(z * factor, 0.5), 5));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (zoom <= 1) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    },
    [zoom, position],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleCopy = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      toast.success("Image copied to clipboard");
    } catch {
      toast.error("Failed to copy image");
    }
  };

  const resetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.min(z * 1.2, 5))}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z / 1.2, 0.5))}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={resetZoom}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Reset zoom"
          >
            <RotateCcw size={18} />
          </button>
          <span className="text-white/60 text-xs font-mono ml-2">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Copy to clipboard"
          >
            <Copy size={18} />
          </button>
          {onDownload && (
            <button
              onClick={onDownload}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Download"
            >
              <Download size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Image */}
      <div
        className="max-w-[90vw] max-h-[85vh] overflow-hidden"
        onWheel={handleWheel}
        style={{
          cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
        }}
      >
        <img
          src={imageUrl}
          alt={alt || "Preview"}
          className="max-w-full max-h-[85vh] object-contain select-none"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            transition: isDragging ? "none" : "transform 0.2s ease",
          }}
          onMouseDown={handleMouseDown}
          draggable={false}
        />
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs font-mono">
        Scroll to zoom · Drag to pan · Esc to close
      </div>
    </div>
  );
};
