import { useState, useEffect, useCallback, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Sparkles, Download, FolderArchive, HardDrive } from 'lucide-react';

import type { ImageCategory, BatchProgress, RateLimitStatus } from '../types/branding';
import { getImagesByCategory, getImageById, TOTAL_IMAGE_COUNT, CATEGORY_COUNTS } from '../lib/brandingConfig';
import { CategorySelector } from '../components/branding/CategorySelector';
import { ImageGrid } from '../components/branding/ImageGrid';
import { BatchProgressModal } from '../components/branding/BatchProgressModal';
import { OutputOptions, type OutputMode } from '../components/branding/OutputOptions';
import { WatermarkSettings } from '../components/branding/WatermarkSettings';
import { RateLimitStatusDisplay } from '../components/branding/RateLimitStatus';
import { convertFormat, addLogoWatermark, type WatermarkPosition } from '../lib/imageProcessing';

const WATERMARK_LOGO_URL = '/logos/artin-icon-white.png';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const LOCAL_SAVER_URL = 'http://localhost:3456';

export function BrandingGenerator() {
    // State
    const [activeCategory, setActiveCategory] = useState<ImageCategory>('hero');
    const [generatedImages, setGeneratedImages] = useState<Map<string, string>>(new Map());
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [outputMode, setOutputMode] = useState<OutputMode>('download');
    const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
    const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus | null>(null);
    const [rateLimitLoading, setRateLimitLoading] = useState(true);
    const [localSaverConnected, setLocalSaverConnected] = useState(false);
    const [autoSave, setAutoSave] = useState(true);
    const [watermarkEnabled, setWatermarkEnabled] = useState(false);
    const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>('bottom-right');

    // Refs for batch cancellation
    const cancelledRef = useRef(false);

    // Check if local saver is running
    const checkLocalSaver = useCallback(async () => {
        try {
            const response = await fetch(`${LOCAL_SAVER_URL}/status`, {
                method: 'GET',
                signal: AbortSignal.timeout(1000)
            });
            if (response.ok) {
                setLocalSaverConnected(true);
                return true;
            }
        } catch {
            setLocalSaverConnected(false);
        }
        return false;
    }, []);

    // Load rate limit status
    const fetchRateLimitStatus = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/api/rate-limit-status`);
            if (response.ok) {
                const data = await response.json();
                setRateLimitStatus(data);
            }
        } catch (error) {
            console.error('Failed to fetch rate limit status:', error);
        } finally {
            setRateLimitLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRateLimitStatus();
        checkLocalSaver();
        // Check local saver periodically
        const interval = setInterval(checkLocalSaver, 5000);
        return () => clearInterval(interval);
    }, [fetchRateLimitStatus, checkLocalSaver]);

    // Clear any legacy localStorage data that may cause issues
    useEffect(() => {
        try {
            localStorage.removeItem('branding-generated-images');
        } catch (e) {
            // Ignore errors
        }
    }, []);

    // Generate timestamped filename
    // Format: YYYYMMDD-HHMMSS-{section}-{concept}.webp
    const generateTimestampedPath = (spec: ReturnType<typeof getImageById>): string => {
        if (!spec) return '';
        const now = new Date();
        const timestamp = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, '0'),
            String(now.getDate()).padStart(2, '0'),
            '-',
            String(now.getHours()).padStart(2, '0'),
            String(now.getMinutes()).padStart(2, '0'),
            String(now.getSeconds()).padStart(2, '0'),
        ].join('');

        // Get the directory from original outputPath
        const dir = spec.outputPath.substring(0, spec.outputPath.lastIndexOf('/'));
        // Create new filename: YYYYMMDD-HHMMSS-{concept}.webp
        const filename = `${timestamp}-${spec.concept}.webp`;

        return `${dir}/${filename}`;
    };

    // Save image to local filesystem via local saver
    const saveToLocal = async (imageId: string, imageUrl: string): Promise<boolean> => {
        const spec = getImageById(imageId);
        if (!spec || !localSaverConnected || !autoSave) return false;

        try {
            // Fetch original image
            const response = await fetch(imageUrl);
            let blob = await response.blob();

            // Apply watermark if enabled
            if (watermarkEnabled) {
                blob = await addLogoWatermark(blob, WATERMARK_LOGO_URL, {
                    position: watermarkPosition,
                    scale: 0.08,
                    padding: 20,
                    opacity: 0.7,
                });
            }

            // Convert to WebP
            const webpBlob = await convertFormat(blob, 'image/webp', 0.9);

            // Convert blob to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(webpBlob);
            });
            const base64Data = await base64Promise;

            // Generate timestamped path so each generation is unique
            const timestampedPath = generateTimestampedPath(spec);

            // Send to local saver
            const saveResponse = await fetch(`${LOCAL_SAVER_URL}/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    outputPath: timestampedPath,
                    imageData: base64Data,
                }),
            });

            if (saveResponse.ok) {
                console.log(`✅ Auto-saved: ${timestampedPath}`);
                return true;
            }
        } catch (error) {
            console.error('Failed to auto-save:', error);
        }
        return false;
    };

    // Generate single image
    const generateImage = async (imageId: string, customPrompt?: string): Promise<string | null> => {
        const spec = getImageById(imageId);
        if (!spec) return null;

        setGeneratingId(imageId);

        try {
            const response = await fetch(`${API_URL}/api/branding/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: customPrompt || spec.prompt,
                    aspectRatio: spec.aspectRatio,
                }),
            });

            // Read response text first, then parse
            const responseText = await response.text();

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Failed to parse response:', responseText.substring(0, 200));
                throw new Error('Invalid response from server. Please try again.');
            }

            if (!response.ok) {
                throw new Error(data.error || 'Generation failed');
            }

            if (data.success && data.imageUrl) {
                setGeneratedImages((prev) => new Map(prev).set(imageId, data.imageUrl));
                await fetchRateLimitStatus();

                // Auto-save to local if connected
                if (localSaverConnected && autoSave) {
                    await saveToLocal(imageId, data.imageUrl);
                }

                return data.imageUrl;
            } else {
                throw new Error(data.error || 'No image returned');
            }
        } catch (error: any) {
            console.error('Generation error:', error);
            alert(error.message || 'Failed to generate image');
            return null;
        } finally {
            setGeneratingId(null);
        }
    };

    // Download single image
    const downloadImage = async (imageId: string) => {
        const imageUrl = generatedImages.get(imageId);
        const spec = getImageById(imageId);
        if (!imageUrl || !spec) return;

        try {
            // Fetch original image
            const response = await fetch(imageUrl);
            let blob = await response.blob();

            // Apply watermark if enabled
            if (watermarkEnabled) {
                blob = await addLogoWatermark(blob, WATERMARK_LOGO_URL, {
                    position: watermarkPosition,
                    scale: 0.08,
                    padding: 20,
                    opacity: 0.7,
                });
            }

            // Convert to WebP
            const webpBlob = await convertFormat(blob, 'image/webp', 0.9);

            // Download
            const url = URL.createObjectURL(webpBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${imageId}.webp`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback: open in new tab
            window.open(imageUrl, '_blank');
        }
    };

    // Batch generate all images in current category
    const generateAllInCategory = async () => {
        const images = getImagesByCategory(activeCategory);
        cancelledRef.current = false;

        setBatchProgress({
            total: images.length,
            completed: 0,
            current: '',
            results: [],
        });

        for (let i = 0; i < images.length; i++) {
            if (cancelledRef.current) {
                setBatchProgress((prev) =>
                    prev ? { ...prev, cancelled: true } : null
                );
                break;
            }

            const spec = images[i];

            setBatchProgress((prev) =>
                prev ? { ...prev, current: spec.name } : null
            );

            const result = await generateImage(spec.id);

            setBatchProgress((prev) =>
                prev
                    ? {
                        ...prev,
                        completed: i + 1,
                        results: [
                            ...prev.results,
                            {
                                imageId: spec.id,
                                success: !!result,
                                imageUrl: result || undefined,
                                error: result ? undefined : 'Generation failed',
                            },
                        ],
                    }
                    : null
            );

            // Small delay between requests to be nice to rate limits
            if (i < images.length - 1 && !cancelledRef.current) {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        }
    };

    // Cancel batch generation
    const cancelBatch = () => {
        cancelledRef.current = true;
    };

    // Close batch modal
    const closeBatchModal = () => {
        setBatchProgress(null);
    };

    // Download all generated images as ZIP
    const downloadAllAsZip = async () => {
        const images = generatedImages;
        if (images.size === 0) {
            alert('No images to download. Generate some images first.');
            return;
        }

        const zip = new JSZip();

        for (const [imageId, imageUrl] of images) {
            const spec = getImageById(imageId);
            if (!spec) continue;

            try {
                // Fetch original image
                const response = await fetch(imageUrl);
                let blob = await response.blob();

                // Apply watermark if enabled
                if (watermarkEnabled) {
                    blob = await addLogoWatermark(blob, WATERMARK_LOGO_URL, {
                        position: watermarkPosition,
                        scale: 0.08,
                        padding: 20,
                        opacity: 0.7,
                    });
                }

                // Convert to WebP
                const webpBlob = await convertFormat(blob, 'image/webp', 0.9);

                // Get folder path from outputPath
                const outputPath = outputMode === 'save'
                    ? spec.outputPath
                    : `${imageId}.webp`;

                zip.file(outputPath, webpBlob);
            } catch (error) {
                console.error(`Failed to process ${imageId}:`, error);
            }
        }

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'artin-branding-assets.zip');
    };

    // Download category images as ZIP
    const downloadCategoryAsZip = async () => {
        const categoryImages = getImagesByCategory(activeCategory);
        const available = categoryImages.filter((img) => generatedImages.has(img.id));

        if (available.length === 0) {
            alert('No images generated in this category yet.');
            return;
        }

        const zip = new JSZip();

        for (const spec of available) {
            const imageUrl = generatedImages.get(spec.id);
            if (!imageUrl) continue;

            try {
                // Fetch original image
                const response = await fetch(imageUrl);
                let blob = await response.blob();

                // Apply watermark if enabled
                if (watermarkEnabled) {
                    blob = await addLogoWatermark(blob, WATERMARK_LOGO_URL, {
                        position: watermarkPosition,
                        scale: 0.08,
                        padding: 20,
                        opacity: 0.7,
                    });
                }

                // Convert to WebP
                const webpBlob = await convertFormat(blob, 'image/webp', 0.9);

                const outputPath = outputMode === 'save'
                    ? spec.outputPath
                    : `${spec.id}.webp`;

                zip.file(outputPath, webpBlob);
            } catch (error) {
                console.error(`Failed to process ${spec.id}:`, error);
            }
        }

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, `artin-${activeCategory}-assets.zip`);
    };

    // Get current category images
    const currentImages = getImagesByCategory(activeCategory);
    const generatedCount = Array.from(generatedImages.keys()).filter((id) => {
        const spec = getImageById(id);
        return spec?.category === activeCategory;
    }).length;

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="section-title">ARTIN Branding Generator</h1>
                        <p className="section-subtitle max-w-2xl">
                            Generate premium brand assets for the ARTIN platform. {TOTAL_IMAGE_COUNT} images total.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Local Saver Status */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                            localSaverConnected
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                            <HardDrive size={14} />
                            <span>{localSaverConnected ? 'Auto-save ON' : 'Auto-save OFF'}</span>
                            {localSaverConnected && (
                                <button
                                    onClick={() => setAutoSave(!autoSave)}
                                    className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                                        autoSave ? 'bg-green-500/30' : 'bg-gray-500/30'
                                    }`}
                                >
                                    {autoSave ? '✓' : '○'}
                                </button>
                            )}
                        </div>
                        <RateLimitStatusDisplay status={rateLimitStatus} loading={rateLimitLoading} />
                    </div>
                </div>
            </div>

            {/* Category Selector */}
            <div className="mb-6">
                <CategorySelector
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                />
            </div>

            {/* Actions Bar */}
            <div className="card mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Left: Output Options and Watermark Settings */}
                    <div className="flex flex-wrap items-center gap-6">
                        <OutputOptions mode={outputMode} onModeChange={setOutputMode} />
                        <WatermarkSettings
                            enabled={watermarkEnabled}
                            position={watermarkPosition}
                            onEnabledChange={setWatermarkEnabled}
                            onPositionChange={setWatermarkPosition}
                        />
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Generate All in Category */}
                        <button
                            onClick={generateAllInCategory}
                            disabled={!!generatingId}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Sparkles size={16} />
                            <span>Generate All ({CATEGORY_COUNTS[activeCategory]})</span>
                        </button>

                        {/* Download Category */}
                        <button
                            onClick={downloadCategoryAsZip}
                            disabled={generatedCount === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border
                                text-white hover:bg-white/10 transition-colors text-sm font-medium
                                disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Download size={16} />
                            <span>Download ({generatedCount})</span>
                        </button>

                        {/* Download All */}
                        <button
                            onClick={downloadAllAsZip}
                            disabled={generatedImages.size === 0}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border
                                text-white hover:bg-white/10 transition-colors text-sm font-medium
                                disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FolderArchive size={16} />
                            <span>All ({generatedImages.size})</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Image Grid */}
            <ImageGrid
                images={currentImages}
                generatedImages={generatedImages}
                generatingId={generatingId}
                onGenerate={generateImage}
                onDownload={downloadImage}
            />

            {/* Batch Progress Modal */}
            {batchProgress && (
                <BatchProgressModal
                    progress={batchProgress}
                    onCancel={cancelBatch}
                    onClose={closeBatchModal}
                />
            )}
        </main>
    );
}
