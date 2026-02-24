import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, Trash2, Info, Upload, FileJson, FileText, Download } from 'lucide-react';

import type {
    BatchPromptItem,
    BatchInputMode,
    BatchAspectRatio,
    BatchGenerationProgress,
} from '../types/batch';
import {
    parseQuickInput,
    itemsToQuickText,
    countPrompts,
    generateBatchItemId,
    enhancePromptWithAspectRatio,
    generateTimestampFilename,
    parseMarkdownPrompts,
    DEFAULT_ASPECT_RATIO,
} from '../lib/batchConfig';
import {
    QuickModeEditor,
    StructuredModeEditor,
    TargetFolderInput,
    addRecentFolder,
    BatchProgressModal,
    BatchResultGrid,
} from '../components/batch';
import { convertFormat } from '../lib/imageProcessing';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const LOCAL_SAVER_URL = 'http://localhost:3456';

export function BatchGenerator() {
    // Input state
    const [inputMode, setInputMode] = useState<BatchInputMode>('quick');
    const [quickText, setQuickText] = useState('');
    const [globalAspectRatio, setGlobalAspectRatio] =
        useState<BatchAspectRatio>(DEFAULT_ASPECT_RATIO);
    const [items, setItems] = useState<BatchPromptItem[]>([]);

    // Target directory
    const [targetDir, setTargetDir] = useState('');
    const [defaultTargetDir, setDefaultTargetDir] = useState('');

    // Local saver connection
    const [localSaverConnected, setLocalSaverConnected] = useState(false);

    // Batch progress
    const [batchProgress, setBatchProgress] =
        useState<BatchGenerationProgress | null>(null);
    const cancelledRef = useRef(false);

    // Check local saver status
    const checkLocalSaver = useCallback(async () => {
        try {
            const response = await fetch(`${LOCAL_SAVER_URL}/status`, {
                method: 'GET',
                signal: AbortSignal.timeout(1000),
            });
            if (response.ok) {
                const data = await response.json();
                setLocalSaverConnected(true);
                if (data.targetDir) {
                    setDefaultTargetDir(data.targetDir);
                }
                return true;
            }
        } catch {
            setLocalSaverConnected(false);
        }
        return false;
    }, []);

    // Poll local saver every 5 seconds
    useEffect(() => {
        checkLocalSaver();
        const interval = setInterval(checkLocalSaver, 5000);
        return () => clearInterval(interval);
    }, [checkLocalSaver]);

    // Prompt count in quick mode
    const promptCount = countPrompts(quickText);

    // Mode switching
    const switchToStructured = () => {
        const parsed = parseQuickInput(quickText, globalAspectRatio);
        setItems(parsed);
        setInputMode('structured');
    };

    const switchToQuick = () => {
        if (items.length > 0) {
            setQuickText(itemsToQuickText(items));
        }
        setInputMode('quick');
    };

    // Structured mode operations
    const updateItem = (id: string, updates: Partial<BatchPromptItem>) => {
        setItems((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
        );
    };

    const removeItem = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            {
                id: generateBatchItemId(),
                prompt: '',
                aspectRatio: globalAspectRatio,
                filename: `batch-${String(prev.length + 1).padStart(3, '0')}.webp`,
                status: 'pending',
            },
        ]);
    };

    const reorderItem = (id: string, direction: 'up' | 'down') => {
        setItems((prev) => {
            const idx = prev.findIndex((item) => item.id === id);
            if (idx < 0) return prev;
            const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
            if (swapIdx < 0 || swapIdx >= prev.length) return prev;
            const next = [...prev];
            [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
            return next;
        });
    };

    // Save a single image to local saver
    const saveToLocal = async (
        filename: string,
        imageUrl: string,
    ): Promise<boolean> => {
        if (!localSaverConnected) return false;

        try {
            // Fetch the generated image
            const response = await fetch(imageUrl);
            let blob = await response.blob();

            // Convert to WebP format
            const webpBlob = await convertFormat(blob, 'image/webp', 0.9);

            // Convert to base64 data URL
            const reader = new FileReader();
            const base64Data = await new Promise<string>((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('Failed to read image data'));
                reader.readAsDataURL(webpBlob);
            });

            // Send to save server
            const saveResponse = await fetch(`${LOCAL_SAVER_URL}/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    outputPath: filename,
                    imageData: base64Data,
                    ...(targetDir ? { targetDir } : {}),
                }),
            });

            return saveResponse.ok;
        } catch (error) {
            console.error('Save to local failed:', error);
            return false;
        }
    };

    // Generate a single image via the backend
    const generateSingleImage = async (
        item: BatchPromptItem,
    ): Promise<{ success: boolean; imageUrl?: string; error?: string }> => {
        try {
            const enhancedPrompt = enhancePromptWithAspectRatio(
                item.prompt,
                item.aspectRatio,
            );

            const response = await fetch(`${API_URL}/api/batch/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: enhancedPrompt }),
                signal: AbortSignal.timeout(120000), // 2 min timeout
            });

            const responseText = await response.text();
            let data;
            try {
                data = JSON.parse(responseText);
            } catch {
                return {
                    success: false,
                    error: 'Invalid response from server',
                };
            }

            if (!response.ok) {
                return {
                    success: false,
                    error: data.error || `Server error: ${response.status}`,
                };
            }

            if (data.success && data.imageUrl) {
                return { success: true, imageUrl: data.imageUrl };
            }

            return { success: false, error: data.error || 'No image returned' };
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Generation failed',
            };
        }
    };

    // Regenerate a single item
    const regenerateSingle = async (id: string) => {
        const item = items.find((i) => i.id === id);
        if (!item) return;

        setItems((prev) =>
            prev.map((i) =>
                i.id === id ? { ...i, status: 'generating', error: undefined } : i,
            ),
        );

        const result = await generateSingleImage(item);

        setItems((prev) =>
            prev.map((i) =>
                i.id === id
                    ? {
                          ...i,
                          status: result.success ? 'success' : 'error',
                          imageUrl: result.imageUrl,
                          error: result.error,
                      }
                    : i,
            ),
        );

        // Auto-save if successful
        if (result.success && result.imageUrl && localSaverConnected) {
            await saveToLocal(item.filename, result.imageUrl);
        }
    };

    // Download a single image
    const downloadSingle = async (item: BatchPromptItem) => {
        if (!item.imageUrl) return;

        try {
            const response = await fetch(item.imageUrl);
            let blob = await response.blob();
            const webpBlob = await convertFormat(blob, 'image/webp', 0.9);

            const url = URL.createObjectURL(webpBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = item.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            if (item.imageUrl) window.open(item.imageUrl, '_blank');
        }
    };

    // Batch generate all items
    const generateAll = async () => {
        // Save the target folder to recent history
        const folderToSave = targetDir || defaultTargetDir;
        if (folderToSave) addRecentFolder(folderToSave);

        // Resolve items from current mode
        let batchItems: BatchPromptItem[];

        if (inputMode === 'quick') {
            const parsed = parseQuickInput(quickText, globalAspectRatio);
            // Apply timestamp filenames
            parsed.forEach((item, idx) => {
                item.filename = generateTimestampFilename(idx);
            });
            setItems(parsed);
            batchItems = parsed;
        } else {
            // Reset status on existing items and apply timestamps where needed
            batchItems = items.map((item, idx) => ({
                ...item,
                status: 'pending' as const,
                imageUrl: undefined,
                error: undefined,
                filename: item.filename || generateTimestampFilename(idx),
            }));
            setItems(batchItems);
        }

        if (batchItems.length === 0) return;

        cancelledRef.current = false;

        setBatchProgress({
            total: batchItems.length,
            completed: 0,
            current: '',
            results: [],
        });

        for (let i = 0; i < batchItems.length; i++) {
            if (cancelledRef.current) {
                setBatchProgress((prev) =>
                    prev ? { ...prev, cancelled: true } : null,
                );
                break;
            }

            const item = batchItems[i];

            // Update current in progress
            setBatchProgress((prev) =>
                prev ? { ...prev, current: item.prompt } : null,
            );

            // Mark as generating
            setItems((prev) =>
                prev.map((it) =>
                    it.id === item.id ? { ...it, status: 'generating' } : it,
                ),
            );

            const result = await generateSingleImage(item);

            // Update item status
            setItems((prev) =>
                prev.map((it) =>
                    it.id === item.id
                        ? {
                              ...it,
                              status: result.success ? 'success' : 'error',
                              imageUrl: result.imageUrl,
                              error: result.error,
                          }
                        : it,
                ),
            );

            // Auto-save if successful
            if (result.success && result.imageUrl && localSaverConnected) {
                await saveToLocal(item.filename, result.imageUrl);
            }

            // Update batch progress
            setBatchProgress((prev) =>
                prev
                    ? {
                          ...prev,
                          completed: i + 1,
                          results: [
                              ...prev.results,
                              {
                                  id: item.id,
                                  success: result.success,
                                  imageUrl: result.imageUrl,
                                  error: result.error,
                              },
                          ],
                      }
                    : null,
            );

            // Delay between requests
            if (i < batchItems.length - 1 && !cancelledRef.current) {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        }
    };

    const cancelBatch = () => {
        cancelledRef.current = true;
    };

    const closeBatchModal = () => {
        setBatchProgress(null);
    };

    const clearAll = () => {
        setQuickText('');
        setItems([]);
    };

    // Load a JSON preset (from file or URL)
    const loadPreset = (json: any) => {
        try {
            if (!json.items || !Array.isArray(json.items)) {
                alert('Invalid preset format: missing "items" array');
                return;
            }

            const loadedItems: BatchPromptItem[] = json.items.map(
                (item: any, index: number) => ({
                    id: generateBatchItemId(),
                    prompt: item.prompt || '',
                    aspectRatio: (item.aspectRatio || json.aspectRatio || '1:1') as BatchAspectRatio,
                    filename: item.filename || `batch-${String(index + 1).padStart(3, '0')}.webp`,
                    status: 'pending' as const,
                }),
            );

            setItems(loadedItems);
            setInputMode('structured');

            // Set target dir if specified in preset
            if (json.targetDir) {
                setTargetDir(json.targetDir);
            }

            // Set global aspect ratio if specified
            if (json.aspectRatio) {
                setGlobalAspectRatio(json.aspectRatio as BatchAspectRatio);
            }
        } catch (error) {
            alert('Failed to parse preset file');
            console.error('Preset load error:', error);
        }
    };

    // Load preset from a URL (e.g. /presets/stock-designs.json)
    const loadPresetFromUrl = async (url: string) => {
        try {
            const response = await fetch(url);
            const json = await response.json();
            loadPreset(json);
        } catch (error) {
            alert('Failed to load preset from URL');
            console.error('Preset URL load error:', error);
        }
    };

    // Load preset from a local file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const json = JSON.parse(reader.result as string);
                loadPreset(json);
            } catch {
                alert('Invalid JSON file');
            }
        };
        reader.readAsText(file);

        // Reset file input so the same file can be re-selected
        e.target.value = '';
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const mdFileInputRef = useRef<HTMLInputElement>(null);

    // Handle Markdown file upload — parse prompts and load into structured mode
    const handleMarkdownUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const markdown = reader.result as string;
                const { items: parsedItems } = parseMarkdownPrompts(
                    markdown,
                    globalAspectRatio,
                );

                if (parsedItems.length === 0) {
                    alert(
                        'No prompts found in this Markdown file.\n\n' +
                        'Supported formats:\n\n' +
                        'Format 1 (headings + paragraphs):\n' +
                        '## Image Name\n' +
                        'Your prompt text here...\n\n' +
                        'Format 2 (bold headers + code blocks):\n' +
                        '**Category — Design Name**\n' +
                        '```\n' +
                        'prompt text here\n' +
                        '```',
                    );
                    return;
                }

                setItems(parsedItems);
                setInputMode('structured');
            } catch (err) {
                alert('Failed to parse Markdown file');
                console.error('Markdown parse error:', err);
            }
        };
        reader.onerror = () => {
            alert('Failed to read file');
        };
        reader.readAsText(file);

        // Reset so same file can be re-selected
        e.target.value = '';
    };

    // Export current items as a downloadable JSON preset file
    const exportAsJson = () => {
        const resolvedItems =
            inputMode === 'quick'
                ? parseQuickInput(quickText, globalAspectRatio)
                : items;

        if (resolvedItems.length === 0) {
            alert('No prompts to export');
            return;
        }

        const preset = {
            name: 'Exported Batch Preset',
            ...(targetDir ? { targetDir } : {}),
            aspectRatio: globalAspectRatio,
            items: resolvedItems.map((item) => ({
                filename: item.filename,
                prompt: item.prompt,
                ...(item.aspectRatio !== globalAspectRatio
                    ? { aspectRatio: item.aspectRatio }
                    : {}),
            })),
        };

        const blob = new Blob([JSON.stringify(preset, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'batch-preset.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Get current item count for the generate button
    const currentItemCount =
        inputMode === 'quick' ? promptCount : items.filter((i) => i.prompt.trim()).length;

    return (
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white uppercase tracking-tight">
                    Batch Generator
                </h1>
                <p className="text-brand-muted mt-1">
                    Generate multiple AI images at once with Gemini 3 Pro
                </p>
            </div>

            <div className="space-y-6">
                {/* Target Folder */}
                <TargetFolderInput
                    value={targetDir}
                    onChange={setTargetDir}
                    saverConnected={localSaverConnected}
                    defaultPath={defaultTargetDir}
                />

                {/* Info Note */}
                <div className="flex items-start gap-2 p-3 bg-white/5 border border-brand-border rounded-lg">
                    <Info size={16} className="text-brand-muted flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-brand-muted">
                        Aspect ratio is suggested in the prompt text. Gemini 3 Pro
                        doesn't have a native aspect ratio parameter, so actual output
                        dimensions may vary slightly.
                    </p>
                </div>

                {/* Load Preset */}
                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={() => loadPresetFromUrl('/presets/stock-designs.json')}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                            border border-brand-border rounded-lg text-brand-muted
                            hover:text-white hover:border-white/30 transition-colors"
                    >
                        <FileJson size={16} />
                        Load Stock Designs (36)
                    </button>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                            border border-brand-border rounded-lg text-brand-muted
                            hover:text-white hover:border-white/30 transition-colors"
                    >
                        <Upload size={16} />
                        Import JSON
                    </button>
                    <button
                        onClick={() => mdFileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                            border border-brand-border rounded-lg text-brand-muted
                            hover:text-white hover:border-white/30 transition-colors"
                    >
                        <FileText size={16} />
                        Import Markdown
                    </button>
                    {currentItemCount > 0 && (
                        <button
                            onClick={exportAsJson}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                                border border-brand-border rounded-lg text-brand-muted
                                hover:text-white hover:border-white/30 transition-colors"
                        >
                            <Download size={16} />
                            Export JSON
                        </button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                    <input
                        ref={mdFileInputRef}
                        type="file"
                        accept=".md,.markdown,.txt"
                        onChange={handleMarkdownUpload}
                        className="hidden"
                    />
                </div>

                {/* Mode Toggle */}
                <div className="flex items-center justify-between">
                    <div className="flex bg-black rounded-lg p-1 border border-brand-border">
                        <button
                            onClick={switchToQuick}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                inputMode === 'quick'
                                    ? 'bg-white text-black'
                                    : 'text-brand-muted hover:text-white'
                            }`}
                        >
                            Quick
                        </button>
                        <button
                            onClick={switchToStructured}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                inputMode === 'structured'
                                    ? 'bg-white text-black'
                                    : 'text-brand-muted hover:text-white'
                            }`}
                        >
                            Structured
                        </button>
                    </div>
                </div>

                {/* Editor */}
                {inputMode === 'quick' ? (
                    <QuickModeEditor
                        text={quickText}
                        onChange={setQuickText}
                        globalAspectRatio={globalAspectRatio}
                        onAspectRatioChange={setGlobalAspectRatio}
                        promptCount={promptCount}
                    />
                ) : (
                    <StructuredModeEditor
                        items={items}
                        onUpdateItem={updateItem}
                        onRemoveItem={removeItem}
                        onAddItem={addItem}
                        onReorderItem={reorderItem}
                    />
                )}

                {/* Action Bar */}
                <div className="flex items-center gap-3 pt-2">
                    <button
                        onClick={generateAll}
                        disabled={currentItemCount === 0 || batchProgress !== null}
                        className="btn-primary flex items-center gap-2 px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Sparkles size={16} />
                        Generate All ({currentItemCount})
                    </button>
                    <button
                        onClick={clearAll}
                        className="btn-secondary flex items-center gap-2 px-4 py-2.5"
                    >
                        <Trash2 size={16} />
                        Clear All
                    </button>
                </div>

                {/* Results Grid */}
                {items.length > 0 && (
                    <BatchResultGrid
                        items={items}
                        onDownloadSingle={downloadSingle}
                        onRegenerateSingle={regenerateSingle}
                    />
                )}
            </div>

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
