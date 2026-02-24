import React from 'react';
import { Download, RefreshCw, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import type { BatchPromptItem } from '../../types/batch';

interface BatchResultGridProps {
    items: BatchPromptItem[];
    onDownloadSingle: (item: BatchPromptItem) => void;
    onRegenerateSingle: (id: string) => void;
}

export const BatchResultGrid: React.FC<BatchResultGridProps> = ({
    items,
    onDownloadSingle,
    onRegenerateSingle,
}) => {
    // Only show the grid if there's at least one non-pending item
    const hasResults = items.some((item) => item.status !== 'pending');
    if (!hasResults) return null;

    return (
        <div>
            <h3 className="text-sm font-medium text-white uppercase tracking-wide mb-4">
                Results ({items.filter((i) => i.status === 'success').length} /{' '}
                {items.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="bg-brand-card border border-brand-border rounded-xl overflow-hidden group"
                    >
                        {/* Image area */}
                        <div className="aspect-square relative bg-black/50">
                            {item.status === 'success' && item.imageUrl ? (
                                <img
                                    src={item.imageUrl}
                                    alt={item.prompt.slice(0, 50)}
                                    className="w-full h-full object-cover"
                                />
                            ) : item.status === 'generating' ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
                                </div>
                            ) : item.status === 'error' ? (
                                <div className="w-full h-full flex flex-col items-center justify-center p-3">
                                    <XCircle className="w-8 h-8 text-red-500/50 mb-2" />
                                    <p className="text-xs text-red-400 text-center line-clamp-2">
                                        {item.error || 'Failed'}
                                    </p>
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Clock className="w-8 h-8 text-white/10" />
                                </div>
                            )}

                            {/* Hover overlay with actions */}
                            {(item.status === 'success' || item.status === 'error') && (
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    {item.status === 'success' && (
                                        <button
                                            onClick={() => onDownloadSingle(item)}
                                            className="p-2 bg-white rounded-lg text-black hover:bg-white/90 transition-colors"
                                            title="Download"
                                        >
                                            <Download size={16} />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => onRegenerateSingle(item.id)}
                                        className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition-colors"
                                        title="Regenerate"
                                    >
                                        <RefreshCw size={16} />
                                    </button>
                                </div>
                            )}

                            {/* Status badge */}
                            <div className="absolute top-2 right-2">
                                {item.status === 'success' && (
                                    <CheckCircle className="w-5 h-5 text-green-500 drop-shadow-lg" />
                                )}
                            </div>
                        </div>

                        {/* Info area */}
                        <div className="p-2.5">
                            <p className="text-xs font-mono text-brand-muted truncate">
                                {item.filename}
                            </p>
                            <p
                                className="text-xs text-white/60 truncate mt-0.5"
                                title={item.prompt}
                            >
                                {item.prompt}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
