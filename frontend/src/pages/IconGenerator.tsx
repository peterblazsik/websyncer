import { useState, useCallback, useEffect } from 'react';
import { FileDropZone } from '../components/shared/FileDropZone';
import { CheckboxGrid } from '../components/shared/CheckboxGrid';
import { ProgressBar } from '../components/shared/ProgressBar';
import {
    resizeImage,
    cropToSquare,
    loadImage,
    IOS_ICON_SIZES,
    MACOS_ICONSET_SIZES,
    WEB_ICON_SIZES,
} from '../lib/imageProcessing';
import { downloadAsZip, blobToDataUrl, type ProcessedImage } from '../lib/downloadHelpers';
import { X, Clipboard } from 'lucide-react';

const FORMAT_OPTIONS = [
    { value: 'ios', label: 'iOS Icons', size: 'All sizes' },
    { value: 'macos', label: 'macOS Iconset', size: 'PNG folder' },
    { value: 'png', label: 'PNG', size: '16-1024px' },
    { value: 'webp', label: 'WebP', size: '16-1024px' },
    { value: 'jpg', label: 'JPG', size: '16-1024px' },
];

export function IconGenerator() {
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFormats, setSelectedFormats] = useState<string[]>([
        'ios',
        'macos',
        'png',
        'webp',
        'jpg',
    ]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, logs: [] as string[] });

    // Handle file selection
    const handleFilesSelected = useCallback(async (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            const url = await blobToDataUrl(files[0]);
            setPreviewUrl(url);
        }
    }, []);

    // Handle paste
    useEffect(() => {
        const handlePaste = async (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (const item of items) {
                if (item.type.startsWith('image/')) {
                    e.preventDefault();
                    const blob = item.getAsFile();
                    if (blob) {
                        setFile(blob);
                        const url = await blobToDataUrl(blob);
                        setPreviewUrl(url);
                    }
                    break;
                }
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, []);

    const clearFile = useCallback(() => {
        setFile(null);
        setPreviewUrl(null);
    }, []);

    const handleGenerate = async () => {
        if (!file || selectedFormats.length === 0) return;

        setProcessing(true);
        const results: ProcessedImage[] = [];
        const logs: string[] = [];

        // Calculate total operations
        let totalOps = 0;
        if (selectedFormats.includes('ios')) totalOps += IOS_ICON_SIZES.length;
        if (selectedFormats.includes('macos')) totalOps += MACOS_ICONSET_SIZES.length;
        if (selectedFormats.includes('png')) totalOps += WEB_ICON_SIZES.length;
        if (selectedFormats.includes('webp')) totalOps += WEB_ICON_SIZES.length;
        if (selectedFormats.includes('jpg')) totalOps += WEB_ICON_SIZES.length;

        let current = 0;

        const addLog = (msg: string) => {
            logs.push(msg);
            setProgress({ current, total: totalOps, logs: [...logs] });
        };

        addLog('Loading and cropping image to square...');

        // Crop to square first
        const squareBlob = await cropToSquare(file);
        const img = await loadImage(squareBlob);

        addLog(`Cropped to ${img.width}x${img.height}`);

        // Generate iOS icons
        if (selectedFormats.includes('ios')) {
            addLog('Generating iOS icons...');
            for (const size of IOS_ICON_SIZES) {
                try {
                    const blob = await resizeImage(img, size.width, size.height, 'image/png', 1);
                    results.push({
                        name: `AppIcon-${size.name}-${size.width}.png`,
                        blob,
                        folder: 'iOS',
                    });
                    addLog(`  Created: AppIcon-${size.name}-${size.width}.png`);
                } catch (error) {
                    addLog(`  Error: iOS ${size.name} - ${error}`);
                }
                current++;
                setProgress({ current, total: totalOps, logs: [...logs] });
            }
        }

        // Generate macOS iconset
        if (selectedFormats.includes('macos')) {
            addLog('Generating macOS iconset...');
            for (const size of MACOS_ICONSET_SIZES) {
                try {
                    const blob = await resizeImage(img, size.width, size.height, 'image/png', 1);
                    results.push({
                        name: `${size.name}.png`,
                        blob,
                        folder: 'macOS/AppIcon.iconset',
                    });
                    addLog(`  Created: ${size.name}.png (${size.width}x${size.height})`);
                } catch (error) {
                    addLog(`  Error: macOS ${size.name} - ${error}`);
                }
                current++;
                setProgress({ current, total: totalOps, logs: [...logs] });
            }
        }

        // Generate PNG icons
        if (selectedFormats.includes('png')) {
            addLog('Generating PNG icons...');
            for (const size of WEB_ICON_SIZES) {
                try {
                    const blob = await resizeImage(img, size, size, 'image/png', 1);
                    results.push({
                        name: `icon-${size}.png`,
                        blob,
                        folder: 'PNG',
                    });
                    addLog(`  Created: icon-${size}.png`);
                } catch (error) {
                    addLog(`  Error: PNG ${size} - ${error}`);
                }
                current++;
                setProgress({ current, total: totalOps, logs: [...logs] });
            }
        }

        // Generate WebP icons
        if (selectedFormats.includes('webp')) {
            addLog('Generating WebP icons...');
            for (const size of WEB_ICON_SIZES) {
                try {
                    const blob = await resizeImage(img, size, size, 'image/webp', 0.9);
                    results.push({
                        name: `icon-${size}.webp`,
                        blob,
                        folder: 'WebP',
                    });
                    addLog(`  Created: icon-${size}.webp`);
                } catch (error) {
                    addLog(`  Error: WebP ${size} - ${error}`);
                }
                current++;
                setProgress({ current, total: totalOps, logs: [...logs] });
            }
        }

        // Generate JPG icons
        if (selectedFormats.includes('jpg')) {
            addLog('Generating JPG icons...');
            for (const size of WEB_ICON_SIZES) {
                try {
                    const blob = await resizeImage(img, size, size, 'image/jpeg', 0.95);
                    results.push({
                        name: `icon-${size}.jpg`,
                        blob,
                        folder: 'JPG',
                    });
                    addLog(`  Created: icon-${size}.jpg`);
                } catch (error) {
                    addLog(`  Error: JPG ${size} - ${error}`);
                }
                current++;
                setProgress({ current, total: totalOps, logs: [...logs] });
            }
        }

        addLog('Creating ZIP file...');
        await downloadAsZip(results, `app-icons-${Date.now()}.zip`);
        addLog('Download complete!');

        setProcessing(false);
    };

    return (
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="section-title">App Icon Generator</h1>
                <p className="section-subtitle">
                    Generate iOS, macOS app icons and web formats from a single source image.
                </p>
            </div>

            <div className="card">
                {/* File Input / Preview */}
                {!file ? (
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <label className="form-label mb-0">Source Image</label>
                            <span className="text-brand-muted text-xs flex items-center gap-1">
                                <Clipboard className="w-3 h-3" />
                                Paste with Cmd+V
                            </span>
                        </div>
                        <FileDropZone
                            onFilesSelected={handleFilesSelected}
                            accept="image/png,image/jpeg,image/webp"
                            multiple={false}
                        />
                    </div>
                ) : (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <label className="form-label mb-0">Source Image</label>
                            <button
                                type="button"
                                onClick={clearFile}
                                className="text-xs text-brand-muted hover:text-white transition-colors flex items-center gap-1"
                            >
                                <X className="w-3 h-3" />
                                Clear
                            </button>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-black rounded border border-brand-border">
                            {previewUrl && (
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-24 h-24 rounded-2xl object-cover shadow-lg"
                                />
                            )}
                            <div className="text-sm text-brand-muted">
                                <p className="text-white font-medium">{file.name}</p>
                                <p>Will be cropped to square from center</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Format Selection */}
                <div className="mb-6">
                    <CheckboxGrid
                        label="Output Formats"
                        options={FORMAT_OPTIONS}
                        selected={selectedFormats}
                        onChange={setSelectedFormats}
                    />
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={!file || selectedFormats.length === 0 || processing}
                    className="btn-primary w-full"
                >
                    {processing ? 'Generating...' : 'Generate Icons'}
                </button>

                {/* Progress */}
                {processing && (
                    <ProgressBar
                        current={progress.current}
                        total={progress.total}
                        logs={progress.logs}
                        status="Generating..."
                    />
                )}
            </div>

            {/* Info Footer */}
            <div className="text-center mt-8 text-brand-muted text-sm space-y-1">
                <p>iOS: 1024, 180, 167, 152, 120, 87, 80, 60, 58, 40 px</p>
                <p>macOS: AppIcon.iconset folder (use iconutil to create .icns)</p>
                <p>Web: 16, 32, 48, 64, 128, 192, 512, 1024 px</p>
            </div>
        </main>
    );
}
