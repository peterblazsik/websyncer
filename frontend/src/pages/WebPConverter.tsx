import { useState, useCallback } from 'react';
import { FileDropZone } from '../components/shared/FileDropZone';
import { CheckboxGrid } from '../components/shared/CheckboxGrid';
import { ProgressBar } from '../components/shared/ProgressBar';
import {
    resizeImage,
    resizeImageFit,
    loadImage,
    WEBP_VARIANTS,
    VARIANT_FOLDERS,
} from '../lib/imageProcessing';
import { downloadAsZip, getBaseName, type ProcessedImage } from '../lib/downloadHelpers';
import { X, FileImage } from 'lucide-react';

const VARIANT_OPTIONS = [
    { value: 'original', label: 'Original', size: '1:1' },
    { value: 'hero-desktop', label: 'Hero Desktop', size: '1920x1080' },
    { value: 'hero-mobile', label: 'Hero Mobile', size: '750x1000' },
    { value: 'feature', label: 'Feature Icon', size: '400x400' },
    { value: 'lifestyle', label: 'Lifestyle', size: '1200x800' },
];

export function WebPConverter() {
    const [files, setFiles] = useState<File[]>([]);
    const [selectedVariants, setSelectedVariants] = useState<string[]>(['original']);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, logs: [] as string[] });

    const handleFilesSelected = useCallback((newFiles: File[]) => {
        setFiles((prev) => [...prev, ...newFiles]);
    }, []);

    const removeFile = useCallback((index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const clearFiles = useCallback(() => {
        setFiles([]);
    }, []);

    const handleConvert = async () => {
        if (files.length === 0 || selectedVariants.length === 0) return;

        setProcessing(true);
        const results: ProcessedImage[] = [];
        const total = files.length * selectedVariants.length;
        let current = 0;
        const logs: string[] = [];

        const addLog = (msg: string) => {
            logs.push(msg);
            setProgress({ current, total, logs: [...logs] });
        };

        addLog(`Starting conversion of ${files.length} files...`);

        for (const file of files) {
            const baseName = getBaseName(file.name);

            // Try to load the image first - skip file if it fails
            let img: HTMLImageElement;
            try {
                addLog(`Loading: ${baseName}...`);
                img = await loadImage(file);
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                addLog(`⚠ Skipping ${baseName}: ${errorMsg}`);
                // Skip all variants for this file and update progress
                current += selectedVariants.length;
                setProgress({ current, total, logs: [...logs] });
                continue;
            }

            for (const variant of selectedVariants) {
                try {
                    let blob: Blob;
                    const folder = VARIANT_FOLDERS[variant] || 'misc';

                    if (variant === 'original') {
                        // Convert to WebP at original size
                        blob = await resizeImageFit(img, img.width, img.height, 'image/webp', 0.8);
                        results.push({
                            name: `${baseName}.webp`,
                            blob,
                            folder,
                        });
                    } else {
                        const size = WEBP_VARIANTS.find((v) => v.name === variant);
                        if (size) {
                            blob = await resizeImage(img, size.width, size.height, 'image/webp', 0.8);
                            results.push({
                                name: `${baseName}-${variant}.webp`,
                                blob,
                                folder,
                            });
                        }
                    }

                    addLog(`✓ Converted: ${baseName} → ${variant}`);
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                    addLog(`✗ Error: ${baseName} (${variant}) - ${errorMsg}`);
                }

                current++;
                setProgress({ current, total, logs: [...logs] });
            }
        }

        if (results.length > 0) {
            addLog('Creating ZIP file...');
            await downloadAsZip(results, `webp-images-${Date.now()}.zip`);
            addLog(`✓ Download complete! ${results.length} images converted.`);
        } else {
            addLog('⚠ No images were converted. Check that your files are valid PNG/JPG images.');
        }

        setProcessing(false);
    };

    return (
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="section-title">WebP Converter</h1>
                <p className="section-subtitle">
                    Convert PNG images to optimized WebP format with multiple size variants.
                </p>
            </div>

            <div className="card">
                {/* File Drop Zone */}
                <div className="mb-6">
                    <FileDropZone
                        onFilesSelected={handleFilesSelected}
                        accept="image/png,image/jpeg"
                        multiple={true}
                    />
                </div>

                {/* Selected Files List */}
                {files.length > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <label className="form-label">Selected Files ({files.length})</label>
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
                                        <span className="text-sm text-white truncate">{file.name}</span>
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

                {/* Variant Selection */}
                <div className="mb-6">
                    <CheckboxGrid
                        label="Output Variants"
                        options={VARIANT_OPTIONS}
                        selected={selectedVariants}
                        onChange={setSelectedVariants}
                    />
                </div>

                {/* Convert Button */}
                <button
                    onClick={handleConvert}
                    disabled={files.length === 0 || selectedVariants.length === 0 || processing}
                    className="btn-primary w-full"
                >
                    {processing ? 'Converting...' : 'Start Conversion'}
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
                <p>Output organized in folders: product/, hero/, features/, lifestyle/</p>
            </div>
        </main>
    );
}
