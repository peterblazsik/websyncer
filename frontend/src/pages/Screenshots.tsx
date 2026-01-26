import { useState, useCallback } from 'react';
import { FileDropZone } from '../components/shared/FileDropZone';
import { CheckboxGrid } from '../components/shared/CheckboxGrid';
import { ProgressBar } from '../components/shared/ProgressBar';
import { resizeImage, loadImage, APPSTORE_SIZES } from '../lib/imageProcessing';
import { downloadAsZip, getBaseName, type ProcessedImage } from '../lib/downloadHelpers';
import { X, FileImage } from 'lucide-react';

const SIZE_OPTIONS = APPSTORE_SIZES.map((size) => ({
    value: size.name,
    label: `${size.name}" Display`,
    size: `${size.width}x${size.height}`,
}));

export function Screenshots() {
    const [files, setFiles] = useState<File[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>(
        APPSTORE_SIZES.map((s) => s.name)
    );
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
        if (files.length === 0 || selectedSizes.length === 0) return;

        setProcessing(true);
        const results: ProcessedImage[] = [];
        const total = files.length * selectedSizes.length;
        let current = 0;
        const logs: string[] = [];

        const addLog = (msg: string) => {
            logs.push(msg);
            setProgress({ current, total, logs: [...logs] });
        };

        addLog(`Processing ${files.length} screenshots for ${selectedSizes.length} device sizes...`);

        for (const file of files) {
            const baseName = getBaseName(file.name);
            const img = await loadImage(file);

            for (const sizeName of selectedSizes) {
                const size = APPSTORE_SIZES.find((s) => s.name === sizeName);
                if (!size) continue;

                try {
                    // Convert to JPG for App Store (no alpha)
                    const blob = await resizeImage(
                        img,
                        size.width,
                        size.height,
                        'image/jpeg',
                        0.95
                    );

                    results.push({
                        name: `${sizeName}-${baseName}.jpg`,
                        blob,
                    });

                    addLog(`Created: ${sizeName}-${baseName}.jpg (${size.width}x${size.height})`);
                } catch (error) {
                    addLog(`Error: ${baseName} (${sizeName}) - ${error}`);
                }

                current++;
                setProgress({ current, total, logs: [...logs] });
            }
        }

        addLog('Creating ZIP file...');
        await downloadAsZip(results, `appstore-screenshots-${Date.now()}.zip`);
        addLog('Download complete!');

        setProcessing(false);
    };

    return (
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="section-title">App Store Screenshots</h1>
                <p className="section-subtitle">
                    Convert PNG screenshots to JPG for Apple App Store Connect with all required
                    iPhone display sizes.
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

                {/* Device Size Selection */}
                <div className="mb-6">
                    <CheckboxGrid
                        label="Device Sizes"
                        options={SIZE_OPTIONS}
                        selected={selectedSizes}
                        onChange={setSelectedSizes}
                    />
                </div>

                {/* Convert Button */}
                <button
                    onClick={handleConvert}
                    disabled={files.length === 0 || selectedSizes.length === 0 || processing}
                    className="btn-primary w-full"
                >
                    {processing ? 'Converting...' : 'Convert Screenshots'}
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
            <div className="text-center mt-8 text-brand-muted text-sm space-y-1">
                <p>6.9" iPhone 16 Pro Max | 6.7" iPhone 14/15/16 Pro Max</p>
                <p>6.5" iPhone 11 Pro Max | 6.1" iPhone 14/15/16 | 5.5" iPhone 8 Plus</p>
                <p className="mt-2">Output: JPG format (no alpha channel) for App Store Connect</p>
            </div>
        </main>
    );
}
