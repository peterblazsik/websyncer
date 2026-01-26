import React from 'react';
import type { BatchProgress } from '../../types/branding';
import { X, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface BatchProgressModalProps {
    progress: BatchProgress;
    onCancel: () => void;
    onClose: () => void;
}

export const BatchProgressModal: React.FC<BatchProgressModalProps> = ({
    progress,
    onCancel,
    onClose,
}) => {
    const isComplete = progress.completed === progress.total || progress.cancelled;
    const successCount = progress.results.filter((r) => r.success).length;
    const failureCount = progress.results.filter((r) => !r.success).length;
    const percentComplete = Math.round((progress.completed / progress.total) * 100);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-brand-card border border-brand-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">
                        {isComplete ? 'Generation Complete' : 'Generating Images...'}
                    </h3>
                    {isComplete && (
                        <button
                            onClick={onClose}
                            className="text-brand-muted hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-brand-muted">Progress</span>
                        <span className="text-white font-medium">
                            {progress.completed} / {progress.total}
                        </span>
                    </div>
                    <div className="h-3 bg-black rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-white/80 to-white transition-all duration-300"
                            style={{ width: `${percentComplete}%` }}
                        />
                    </div>
                </div>

                {/* Current Status */}
                {!isComplete && (
                    <div className="flex items-center gap-3 p-3 bg-black/50 rounded-lg mb-4">
                        <Loader2 className="w-5 h-5 text-white animate-spin flex-shrink-0" />
                        <div className="min-w-0">
                            <div className="text-sm text-white truncate">{progress.current}</div>
                            <div className="text-xs text-brand-muted">Generating...</div>
                        </div>
                    </div>
                )}

                {/* Results Summary (when complete) */}
                {isComplete && (
                    <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <div>
                                <div className="text-sm text-white font-medium">
                                    {successCount} images generated
                                </div>
                            </div>
                        </div>

                        {failureCount > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                <div>
                                    <div className="text-sm text-white font-medium">
                                        {failureCount} failed
                                    </div>
                                </div>
                            </div>
                        )}

                        {progress.cancelled && (
                            <div className="text-sm text-brand-muted text-center">
                                Generation was cancelled
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    {!isComplete ? (
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 rounded-lg border border-brand-border
                                text-white hover:bg-white/10 transition-colors text-sm font-medium"
                        >
                            Cancel
                        </button>
                    ) : (
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 rounded-lg bg-white text-black
                                hover:bg-white/90 transition-colors text-sm font-medium"
                        >
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
