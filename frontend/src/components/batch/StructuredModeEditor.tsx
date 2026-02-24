import React from 'react';
import { Trash2, ChevronUp, ChevronDown, Plus, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { BatchPromptItem, BatchAspectRatio } from '../../types/batch';
import { ASPECT_RATIO_OPTIONS } from '../../lib/batchConfig';

interface StructuredModeEditorProps {
    items: BatchPromptItem[];
    onUpdateItem: (id: string, updates: Partial<BatchPromptItem>) => void;
    onRemoveItem: (id: string) => void;
    onAddItem: () => void;
    onReorderItem: (id: string, direction: 'up' | 'down') => void;
}

export const StructuredModeEditor: React.FC<StructuredModeEditorProps> = ({
    items,
    onUpdateItem,
    onRemoveItem,
    onAddItem,
    onReorderItem,
}) => {
    return (
        <div className="space-y-3">
            {items.map((item, index) => (
                <div
                    key={item.id}
                    className={`bg-brand-card border rounded-xl p-4 transition-colors ${
                        item.status === 'success'
                            ? 'border-green-500/40'
                            : item.status === 'error'
                              ? 'border-red-500/40'
                              : item.status === 'generating'
                                ? 'border-white/30'
                                : 'border-brand-border'
                    }`}
                >
                    {/* Header row: index + status + reorder + remove */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-brand-muted w-6">
                                #{index + 1}
                            </span>
                            {item.status === 'generating' && (
                                <Loader2 className="w-4 h-4 text-white animate-spin" />
                            )}
                            {item.status === 'success' && (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            {item.status === 'error' && (
                                <XCircle className="w-4 h-4 text-red-500" />
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onReorderItem(item.id, 'up')}
                                disabled={index === 0}
                                className="p-1 text-brand-muted hover:text-white disabled:opacity-30 transition-colors"
                                title="Move up"
                            >
                                <ChevronUp size={16} />
                            </button>
                            <button
                                onClick={() => onReorderItem(item.id, 'down')}
                                disabled={index === items.length - 1}
                                className="p-1 text-brand-muted hover:text-white disabled:opacity-30 transition-colors"
                                title="Move down"
                            >
                                <ChevronDown size={16} />
                            </button>
                            <button
                                onClick={() => onRemoveItem(item.id)}
                                className="p-1 text-brand-muted hover:text-red-400 transition-colors ml-1"
                                title="Remove"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Prompt textarea */}
                    <textarea
                        value={item.prompt}
                        onChange={(e) =>
                            onUpdateItem(item.id, { prompt: e.target.value })
                        }
                        placeholder="Enter your image prompt..."
                        className="form-input w-full text-sm min-h-[60px] resize-y mb-3"
                        rows={2}
                    />

                    {/* Settings row: aspect ratio + filename */}
                    <div className="flex items-center gap-3">
                        <select
                            value={item.aspectRatio}
                            onChange={(e) =>
                                onUpdateItem(item.id, {
                                    aspectRatio: e.target.value as BatchAspectRatio,
                                })
                            }
                            className="form-select text-xs py-1.5 px-2 w-auto"
                        >
                            {ASPECT_RATIO_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={item.filename}
                            onChange={(e) =>
                                onUpdateItem(item.id, { filename: e.target.value })
                            }
                            placeholder="filename.webp"
                            className="form-input text-xs py-1.5 px-2 flex-1 font-mono"
                        />
                    </div>

                    {/* Error message */}
                    {item.status === 'error' && item.error && (
                        <p className="text-xs text-red-400 mt-2">{item.error}</p>
                    )}
                </div>
            ))}

            {/* Add prompt button */}
            <button
                onClick={onAddItem}
                className="w-full py-3 border border-dashed border-brand-border rounded-xl
                    text-brand-muted hover:text-white hover:border-white/30
                    transition-colors flex items-center justify-center gap-2 text-sm"
            >
                <Plus size={16} />
                Add Prompt
            </button>
        </div>
    );
};
