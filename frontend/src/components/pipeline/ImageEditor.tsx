import { useState, useRef, useCallback, useEffect } from "react";
import { RotateCw, RotateCcw, Check, X } from "lucide-react";

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type DragMode =
  | "create"
  | "move"
  | "resize-tl"
  | "resize-tr"
  | "resize-bl"
  | "resize-br"
  | null;

interface ImageEditorProps {
  sourceUrl: string;
  onApply: (editedImage: HTMLImageElement, editedUrl: string) => void;
  onCancel: () => void;
}

const CORNER_HIT_RADIUS = 10;
const MIN_CROP_SIZE = 20;

export function ImageEditor({
  sourceUrl,
  onApply,
  onCancel,
}: ImageEditorProps) {
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [rotation, setRotation] = useState(0);
  const [fineRotation, setFineRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [initialCrop, setInitialCrop] = useState<CropRect | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const sourceImgRef = useRef<HTMLImageElement | null>(null);

  const totalRotation = rotation + fineRotation;

  // Preload the source image for canvas operations
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = sourceUrl;
    img.onload = () => {
      sourceImgRef.current = img;
    };
  }, [sourceUrl]);

  // Clear crop when rotation changes since the displayed bounds shift
  useEffect(() => {
    setCrop(null);
  }, [rotation, fineRotation]);

  // Returns the bounding rect of the displayed image relative to the container
  const getImageBounds = useCallback(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) return null;

    const containerRect = container.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();

    return {
      x: imageRect.left - containerRect.left,
      y: imageRect.top - containerRect.top,
      width: imageRect.width,
      height: imageRect.height,
    };
  }, []);

  // Clamp a crop rect to stay within displayed image bounds
  const clampCrop = useCallback(
    (c: CropRect): CropRect => {
      const bounds = getImageBounds();
      if (!bounds) return c;

      let { x, y, width, height } = c;

      // Ensure non-negative dimensions
      if (width < 0) {
        x += width;
        width = -width;
      }
      if (height < 0) {
        y += height;
        height = -height;
      }

      // Clamp to image bounds
      x = Math.max(0, Math.min(x, bounds.width - MIN_CROP_SIZE));
      y = Math.max(0, Math.min(y, bounds.height - MIN_CROP_SIZE));
      width = Math.max(MIN_CROP_SIZE, Math.min(width, bounds.width - x));
      height = Math.max(MIN_CROP_SIZE, Math.min(height, bounds.height - y));

      return { x, y, width, height };
    },
    [getImageBounds],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();

      const bounds = getImageBounds();
      if (!bounds) return;

      const containerRect = containerRef.current!.getBoundingClientRect();
      const mx = e.clientX - containerRect.left;
      const my = e.clientY - containerRect.top;

      // Coordinates relative to the displayed image
      const rx = mx - bounds.x;
      const ry = my - bounds.y;

      // Only allow interaction within the image bounds
      if (rx < 0 || ry < 0 || rx > bounds.width || ry > bounds.height) return;

      if (crop) {
        // Check corners for resize handles
        const corners: { mode: DragMode; cx: number; cy: number }[] = [
          { mode: "resize-tl", cx: crop.x, cy: crop.y },
          { mode: "resize-tr", cx: crop.x + crop.width, cy: crop.y },
          { mode: "resize-bl", cx: crop.x, cy: crop.y + crop.height },
          {
            mode: "resize-br",
            cx: crop.x + crop.width,
            cy: crop.y + crop.height,
          },
        ];

        for (const c of corners) {
          if (
            Math.abs(rx - c.cx) < CORNER_HIT_RADIUS &&
            Math.abs(ry - c.cy) < CORNER_HIT_RADIUS
          ) {
            setDragMode(c.mode);
            setDragStart({ x: e.clientX, y: e.clientY });
            setInitialCrop({ ...crop });
            setIsDragging(true);
            return;
          }
        }

        // Check if inside crop rect for move
        if (
          rx >= crop.x &&
          rx <= crop.x + crop.width &&
          ry >= crop.y &&
          ry <= crop.y + crop.height
        ) {
          setDragMode("move");
          setDragStart({ x: e.clientX, y: e.clientY });
          setInitialCrop({ ...crop });
          setIsDragging(true);
          return;
        }
      }

      // Start a new crop
      setCrop({ x: rx, y: ry, width: 0, height: 0 });
      setDragMode("create");
      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialCrop({ x: rx, y: ry, width: 0, height: 0 });
      setIsDragging(true);
    },
    [crop, getImageBounds],
  );

  // Attach mousemove/mouseup to document so dragging outside the container works
  useEffect(() => {
    if (!isDragging || !dragStart || !initialCrop) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;

      let newCrop: CropRect;

      switch (dragMode) {
        case "create":
          newCrop = {
            x: initialCrop.x,
            y: initialCrop.y,
            width: dx,
            height: dy,
          };
          // Normalize negative dimensions for clamping, but keep origin at drag start
          if (newCrop.width < 0) {
            newCrop.x = initialCrop.x + newCrop.width;
            newCrop.width = -newCrop.width;
          }
          if (newCrop.height < 0) {
            newCrop.y = initialCrop.y + newCrop.height;
            newCrop.height = -newCrop.height;
          }
          break;

        case "move":
          newCrop = {
            x: initialCrop.x + dx,
            y: initialCrop.y + dy,
            width: initialCrop.width,
            height: initialCrop.height,
          };
          break;

        case "resize-tl":
          newCrop = {
            x: initialCrop.x + dx,
            y: initialCrop.y + dy,
            width: initialCrop.width - dx,
            height: initialCrop.height - dy,
          };
          break;

        case "resize-tr":
          newCrop = {
            x: initialCrop.x,
            y: initialCrop.y + dy,
            width: initialCrop.width + dx,
            height: initialCrop.height - dy,
          };
          break;

        case "resize-bl":
          newCrop = {
            x: initialCrop.x + dx,
            y: initialCrop.y,
            width: initialCrop.width - dx,
            height: initialCrop.height + dy,
          };
          break;

        case "resize-br":
          newCrop = {
            x: initialCrop.x,
            y: initialCrop.y,
            width: initialCrop.width + dx,
            height: initialCrop.height + dy,
          };
          break;

        default:
          return;
      }

      setCrop(clampCrop(newCrop));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragMode(null);
      setDragStart(null);
      setInitialCrop(null);

      // Remove crops that are too small
      setCrop((prev) => {
        if (!prev) return null;
        if (prev.width < MIN_CROP_SIZE || prev.height < MIN_CROP_SIZE)
          return null;
        return prev;
      });
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart, dragMode, initialCrop, clampCrop]);

  const applyEdits = useCallback(() => {
    const img = sourceImgRef.current;
    if (!img) return;

    const bounds = getImageBounds();
    if (!bounds) return;

    const rad = (totalRotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    const rotW = img.naturalWidth * cos + img.naturalHeight * sin;
    const rotH = img.naturalWidth * sin + img.naturalHeight * cos;

    // Render rotated image to an offscreen canvas
    const rotCanvas = document.createElement("canvas");
    rotCanvas.width = Math.round(rotW);
    rotCanvas.height = Math.round(rotH);
    const rotCtx = rotCanvas.getContext("2d")!;
    rotCtx.translate(rotW / 2, rotH / 2);
    rotCtx.rotate(rad);
    rotCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

    // If there is a crop, map display coords to actual pixel coords
    if (crop && bounds.width > 0 && bounds.height > 0) {
      const scaleX = rotW / bounds.width;
      const scaleY = rotH / bounds.height;
      const cropX = Math.round(crop.x * scaleX);
      const cropY = Math.round(crop.y * scaleY);
      const cropW = Math.round(crop.width * scaleX);
      const cropH = Math.round(crop.height * scaleY);

      const outCanvas = document.createElement("canvas");
      outCanvas.width = cropW;
      outCanvas.height = cropH;
      const outCtx = outCanvas.getContext("2d")!;
      outCtx.drawImage(
        rotCanvas,
        cropX,
        cropY,
        cropW,
        cropH,
        0,
        0,
        cropW,
        cropH,
      );

      emitResult(outCanvas);
    } else {
      // No crop -- just apply rotation
      emitResult(rotCanvas);
    }
  }, [totalRotation, crop, getImageBounds, sourceUrl]);

  const emitResult = (canvas: HTMLCanvasElement) => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const resultImg = new Image();
      resultImg.onload = () => onApply(resultImg, url);
      resultImg.src = url;
    }, "image/png");
  };

  // Determine cursor style based on mouse position
  const getCursorStyle = (): string => {
    if (isDragging) {
      if (dragMode === "move") return "grabbing";
      if (dragMode?.startsWith("resize")) return "nwse-resize";
      return "crosshair";
    }
    return "crosshair";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-brand-border bg-black/50 flex-wrap">
        <button
          type="button"
          onClick={() => setRotation((r) => r - 90)}
          className="p-1.5 text-brand-muted hover:text-white transition-colors rounded flex items-center gap-1 text-xs"
          title="Rotate 90 counter-clockwise"
        >
          <RotateCcw className="w-4 h-4" />
          <span>-90</span>
        </button>
        <button
          type="button"
          onClick={() => setRotation((r) => r + 90)}
          className="p-1.5 text-brand-muted hover:text-white transition-colors rounded flex items-center gap-1 text-xs"
          title="Rotate 90 clockwise"
        >
          <RotateCw className="w-4 h-4" />
          <span>+90</span>
        </button>

        <div className="flex items-center gap-2 ml-2">
          <span className="text-xs text-brand-muted font-mono w-10 text-right">
            {fineRotation > 0 ? "+" : ""}
            {fineRotation}
          </span>
          <input
            type="range"
            min={-45}
            max={45}
            step={1}
            value={fineRotation}
            onChange={(e) => setFineRotation(parseInt(e.target.value))}
            className="w-24"
            title="Fine rotation"
          />
        </div>

        {totalRotation !== 0 && (
          <span className="text-xs text-brand-muted ml-1">
            Total: {totalRotation}
          </span>
        )}

        <div className="flex-1" />

        {crop && (
          <button
            type="button"
            onClick={() => setCrop(null)}
            className="p-1.5 text-brand-muted hover:text-white transition-colors rounded flex items-center gap-1 text-xs"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Crop</span>
          </button>
        )}

        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary px-3 py-1.5 text-xs"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={applyEdits}
          className="btn-primary px-4 py-1.5 text-xs flex items-center gap-1"
        >
          <Check className="w-3.5 h-3.5" />
          Apply
        </button>
      </div>

      {/* Image canvas area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden bg-[#111] relative select-none"
        style={{ cursor: getCursorStyle() }}
        onMouseDown={handleMouseDown}
      >
        {/* Checkerboard background */}
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

        {/* The displayed image with rotation */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            ref={imageRef}
            src={sourceUrl}
            alt="Edit source"
            className="max-w-[90%] max-h-[90%] object-contain"
            style={{ transform: `rotate(${totalRotation}deg)` }}
            draggable={false}
          />
        </div>

        {/* Crop overlay */}
        {crop && crop.width > 0 && crop.height > 0 && (
          <CropOverlay crop={crop} getImageBounds={getImageBounds} />
        )}
      </div>

      {/* Hint */}
      <div className="px-4 py-1.5 border-t border-brand-border bg-black/50">
        <p className="text-xs text-brand-muted">
          Click and drag on the image to crop. Use rotation controls above.
          Click Apply when done.
        </p>
      </div>
    </div>
  );
}

// Separate component to avoid re-render complexity in the parent
function CropOverlay({
  crop,
  getImageBounds,
}: {
  crop: CropRect;
  getImageBounds: () => {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}) {
  const bounds = getImageBounds();
  if (!bounds) return null;

  // Position the crop overlay relative to the container, offset by image position
  const overlayStyle: React.CSSProperties = {
    position: "absolute",
    left: bounds.x + crop.x,
    top: bounds.y + crop.y,
    width: crop.width,
    height: crop.height,
    border: "2px solid rgba(255, 255, 255, 0.9)",
    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
    pointerEvents: "none" as const,
    zIndex: 10,
  };

  const cornerPositions = [
    { key: "tl", left: -5, top: -5 },
    { key: "tr", right: -5, top: -5 },
    { key: "bl", left: -5, bottom: -5 },
    { key: "br", right: -5, bottom: -5 },
  ];

  return (
    <div style={overlayStyle}>
      {cornerPositions.map(({ key, ...pos }) => (
        <div
          key={key}
          className="absolute w-2.5 h-2.5 bg-white rounded-full border border-black/50"
          style={{ ...pos, pointerEvents: "none" }}
        />
      ))}
      {/* Dimension label */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] text-white bg-black/70 px-1.5 py-0.5 rounded whitespace-nowrap">
        {Math.round(crop.width)} x {Math.round(crop.height)}
      </div>
    </div>
  );
}
