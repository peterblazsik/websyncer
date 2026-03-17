import { useState } from "react";
import { Download, Copy, FileImage, Check } from "lucide-react";
import { toast } from "sonner";
import { svgToPng } from "../../lib/vectorizeEngine";
import { downloadFile } from "../../lib/downloadHelpers";

interface VectorizeToolbarProps {
  svgString: string | null;
  dimensions: { width: number; height: number } | null;
  disabled: boolean;
}

export function VectorizeToolbar({
  svgString,
  dimensions,
  disabled,
}: VectorizeToolbarProps) {
  const [pngScale, setPngScale] = useState(2);
  const [copied, setCopied] = useState(false);

  const handleDownloadSvg = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    downloadFile(blob, `vectorized-${Date.now()}.svg`);
    toast.success("SVG downloaded");
  };

  const handleDownloadPng = async () => {
    if (!svgString || !dimensions) return;
    try {
      const w = dimensions.width * pngScale;
      const h = dimensions.height * pngScale;
      const blob = await svgToPng(svgString, w, h);
      downloadFile(blob, `vectorized-${Date.now()}.png`);
      toast.success("PNG downloaded");
    } catch {
      toast.error("Failed to render PNG");
    }
  };

  const handleCopySvg = async () => {
    if (!svgString) return;
    try {
      await navigator.clipboard.writeText(svgString);
      setCopied(true);
      toast.success("SVG copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const isDisabled = disabled || !svgString;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-brand-border bg-black/50">
      {/* Download SVG */}
      <button
        type="button"
        onClick={handleDownloadSvg}
        disabled={isDisabled}
        className="btn-primary !py-2 !px-4 text-sm flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        SVG
      </button>

      {/* Download PNG */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDownloadPng}
          disabled={isDisabled}
          className="btn-secondary !py-2 !px-4 !border text-sm flex items-center gap-2"
        >
          <FileImage className="w-4 h-4" />
          PNG
        </button>
        <select
          value={pngScale}
          onChange={(e) => setPngScale(parseInt(e.target.value))}
          disabled={isDisabled}
          className="form-select !py-1.5 !px-2 text-xs w-16"
        >
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
          <option value={8}>8x</option>
        </select>
      </div>

      {/* Copy SVG Code */}
      <button
        type="button"
        onClick={handleCopySvg}
        disabled={isDisabled}
        className="btn-secondary !py-2 !px-4 !border text-sm flex items-center gap-2"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? "Copied" : "Copy SVG"}
      </button>

      {/* SVG file size indicator */}
      {svgString && (
        <span className="text-xs text-brand-muted ml-auto">
          SVG: {(new Blob([svgString]).size / 1024).toFixed(1)} KB
        </span>
      )}
    </div>
  );
}
