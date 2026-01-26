import { useState, useCallback } from "react";
import { FileDropZone } from "../components/shared/FileDropZone";
import { ProgressBar } from "../components/shared/ProgressBar";
import {
  loadImage,
  resizeImageFit,
  type ImageFormat,
} from "../lib/imageProcessing";
import {
  downloadAsZip,
  downloadFile,
  getBaseName,
  type ProcessedImage,
} from "../lib/downloadHelpers";
import { convertHeicToBlob, validateHeicFile } from "../lib/heicProcessing";
import { X, FileImage, Check } from "lucide-react";

type OutputFormat = "jpeg" | "png";
type ResizeMode = "original" | "custom";

export function HeicConverter() {
  const [files, setFiles] = useState<File[]>([]);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("jpeg");
  const [quality, setQuality] = useState(92);
  const [resizeMode, setResizeMode] = useState<ResizeMode>("original");
  const [maxWidth, setMaxWidth] = useState(1920);
  const [maxHeight, setMaxHeight] = useState(1080);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    logs: [] as string[],
  });

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    // Filter to only HEIC/HEIF files
    const heicFiles = newFiles.filter((file) => {
      const validation = validateHeicFile(file);
      return validation.valid;
    });
    setFiles((prev) => [...prev, ...heicFiles]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const handleConvert = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    const results: ProcessedImage[] = [];
    const total = files.length;
    let current = 0;
    const logs: string[] = [];

    const addLog = (msg: string) => {
      logs.push(msg);
      setProgress({ current, total, logs: [...logs] });
    };

    const outputMime: ImageFormat =
      outputFormat === "jpeg" ? "image/jpeg" : "image/png";
    const extension = outputFormat === "jpeg" ? "jpg" : "png";
    const qualityDecimal = quality / 100;

    addLog(
      `Starting conversion of ${files.length} HEIC files to ${extension.toUpperCase()}...`,
    );

    for (const file of files) {
      const baseName = getBaseName(file.name);

      try {
        addLog(`Converting: ${baseName}...`);

        // Step 1: Convert HEIC to standard format blob
        const convertedBlob = await convertHeicToBlob(
          file,
          outputMime,
          qualityDecimal,
        );

        let finalBlob: Blob;

        // Step 2: Apply resize if requested
        if (resizeMode === "custom") {
          const img = await loadImage(convertedBlob);
          finalBlob = await resizeImageFit(
            img,
            maxWidth,
            maxHeight,
            outputMime,
            qualityDecimal,
          );
          addLog(`  Resized to max ${maxWidth}x${maxHeight}`);
        } else {
          finalBlob = convertedBlob;
        }

        results.push({
          name: `${baseName}.${extension}`,
          blob: finalBlob,
        });

        addLog(`Converted: ${baseName}.${extension}`);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        addLog(`Skipping ${baseName}: ${errorMsg}`);
      }

      current++;
      setProgress({ current, total, logs: [...logs] });
    }

    // Download results
    if (results.length > 0) {
      if (results.length === 1) {
        addLog("Downloading file...");
        downloadFile(results[0].blob, results[0].name);
      } else {
        addLog("Creating ZIP file...");
        await downloadAsZip(results, `heic-converted-${Date.now()}.zip`);
      }
      addLog(`Done! ${results.length} of ${files.length} files converted.`);
    } else {
      addLog(
        "No files were converted. Check that your files are valid HEIC images.",
      );
    }

    setProcessing(false);
  };

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="section-title">HEIC Converter</h1>
        <p className="section-subtitle">
          Convert Apple HEIC/HEIF images to JPG or PNG format.
        </p>
      </div>

      <div className="card">
        {/* File Drop Zone */}
        <div className="mb-6">
          <FileDropZone
            onFilesSelected={handleFilesSelected}
            accept=".heic,.heif"
            multiple={true}
          />
        </div>

        {/* Selected Files List */}
        {files.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="form-label">
                Selected Files ({files.length})
              </label>
              <button
                type="button"
                onClick={clearFiles}
                className="text-xs text-brand-muted hover:text-white transition-colors"
              >
                Clear All
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between px-3 py-2 bg-black rounded border border-brand-border"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileImage className="w-4 h-4 text-brand-muted flex-shrink-0" />
                    <span className="text-sm text-white truncate">
                      {file.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-brand-muted hover:text-white p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Output Format Selection */}
        <div className="mb-6">
          <label className="form-label">Output Format</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className={`checkbox-item ${outputFormat === "jpeg" ? "checked" : ""}`}
              onClick={() => setOutputFormat("jpeg")}
            >
              <div className="checkbox-box">
                {outputFormat === "jpeg" && (
                  <Check className="w-3 h-3 text-black" />
                )}
              </div>
              <span className="text-white font-medium text-sm">JPG</span>
              <span className="text-brand-muted text-xs ml-auto">
                Smaller size
              </span>
            </button>
            <button
              type="button"
              className={`checkbox-item ${outputFormat === "png" ? "checked" : ""}`}
              onClick={() => setOutputFormat("png")}
            >
              <div className="checkbox-box">
                {outputFormat === "png" && (
                  <Check className="w-3 h-3 text-black" />
                )}
              </div>
              <span className="text-white font-medium text-sm">PNG</span>
              <span className="text-brand-muted text-xs ml-auto">Lossless</span>
            </button>
          </div>
        </div>

        {/* Quality Slider (JPG only) */}
        {outputFormat === "jpeg" && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">Quality</label>
              <span className="text-white text-sm font-bold">{quality}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={(e) => setQuality(parseInt(e.target.value))}
              className="w-full h-2 bg-brand-border rounded-lg appearance-none cursor-pointer accent-white"
            />
            <div className="flex justify-between text-xs text-brand-muted mt-1">
              <span>Smaller file</span>
              <span>Better quality</span>
            </div>
          </div>
        )}

        {/* Resize Options */}
        <div className="mb-6">
          <label className="form-label">Resize</label>
          <div className="space-y-3">
            <button
              type="button"
              className={`checkbox-item w-full ${resizeMode === "original" ? "checked" : ""}`}
              onClick={() => setResizeMode("original")}
            >
              <div className="checkbox-box">
                {resizeMode === "original" && (
                  <Check className="w-3 h-3 text-black" />
                )}
              </div>
              <span className="text-white font-medium text-sm">
                Keep Original Size
              </span>
            </button>
            <button
              type="button"
              className={`checkbox-item w-full ${resizeMode === "custom" ? "checked" : ""}`}
              onClick={() => setResizeMode("custom")}
            >
              <div className="checkbox-box">
                {resizeMode === "custom" && (
                  <Check className="w-3 h-3 text-black" />
                )}
              </div>
              <span className="text-white font-medium text-sm">
                Custom Maximum Size
              </span>
            </button>

            {resizeMode === "custom" && (
              <div className="grid grid-cols-2 gap-3 mt-3 pl-7">
                <div>
                  <label className="form-label text-xs">Max Width (px)</label>
                  <input
                    type="number"
                    value={maxWidth}
                    onChange={(e) => setMaxWidth(parseInt(e.target.value) || 0)}
                    className="form-input"
                    min="1"
                    max="10000"
                  />
                </div>
                <div>
                  <label className="form-label text-xs">Max Height (px)</label>
                  <input
                    type="number"
                    value={maxHeight}
                    onChange={(e) =>
                      setMaxHeight(parseInt(e.target.value) || 0)
                    }
                    className="form-input"
                    min="1"
                    max="10000"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Convert Button */}
        <button
          onClick={handleConvert}
          disabled={files.length === 0 || processing}
          className="btn-primary w-full"
        >
          {processing ? "Converting..." : "Start Conversion"}
        </button>

        {/* Progress */}
        {processing && (
          <ProgressBar
            current={progress.current}
            total={progress.total}
            logs={progress.logs}
            status="Converting..."
          />
        )}
      </div>

      {/* Info Footer */}
      <div className="text-center mt-8 text-brand-muted text-sm">
        <p>HEIC is Apple's high-efficiency image format used by iOS devices.</p>
        <p className="mt-1">All processing runs locally in your browser.</p>
      </div>
    </main>
  );
}
