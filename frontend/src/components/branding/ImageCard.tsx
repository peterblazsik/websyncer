import React, { useState, useEffect } from 'react';
import type { ImageSpec } from '../../types/branding';
import { Sparkles, Download, Check, Loader2, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface ImageCardProps {
    spec: ImageSpec;
    generatedUrl?: string;
    onGenerate: (customPrompt?: string) => void;
    onDownload: () => void;
    isGenerating: boolean;
}

export const ImageCard: React.FC<ImageCardProps> = ({
    spec,
    generatedUrl,
    onGenerate,
    onDownload,
    isGenerating,
}) => {
    const hasImage = !!generatedUrl;
    const aspectRatioStyle = getAspectRatioStyle(spec.aspectRatio);

    // Editable prompt state
    const [customPrompt, setCustomPrompt] = useState(spec.prompt);
    const [isPromptExpanded, setIsPromptExpanded] = useState(false);
    const isPromptModified = customPrompt !== spec.prompt;

    // Reset prompt when spec changes
    useEffect(() => {
        setCustomPrompt(spec.prompt);
    }, [spec.prompt]);

    const handleResetPrompt = () => {
        setCustomPrompt(spec.prompt);
    };

    const handleGenerate = () => {
        onGenerate(isPromptModified ? customPrompt : undefined);
    };

    return (
        <div className="bg-brand-card border border-brand-border rounded-xl overflow-hidden group">
            {/* Image Preview Area */}
            <div className="relative" style={aspectRatioStyle}>
                {hasImage ? (
                    <img
                        src={generatedUrl}
                        alt={spec.name}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-4">
                        {/* Accent color indicator for features */}
                        {spec.accentColor && (
                            <div
                                className="w-8 h-8 rounded-full mb-3 border-2 border-white/20"
                                style={{ backgroundColor: spec.accentColor }}
                            />
                        )}
                        <div className="text-brand-muted text-xs text-center">
                            <div className="font-medium text-white/60 mb-1">
                                {spec.dimensions.width} × {spec.dimensions.height}
                            </div>
                            <div className="text-white/40">{spec.aspectRatio}</div>
                        </div>
                    </div>
                )}

                {/* Generating overlay */}
                {isGenerating && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                            <span className="text-sm text-white/80">Generating...</span>
                        </div>
                    </div>
                )}

                {/* Success indicator */}
                {hasImage && !isGenerating && (
                    <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <Check size={14} className="text-white" />
                        </div>
                    </div>
                )}
            </div>

            {/* Card Footer */}
            <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <h4 className="text-sm font-medium text-white truncate">{spec.name}</h4>
                        {spec.subcategory && (
                            <p className="text-xs text-brand-muted capitalize">
                                {spec.subcategory.replace('-', ' ')}
                            </p>
                        )}
                    </div>
                </div>

                {/* Expandable Prompt Editor */}
                <div className="border border-brand-border rounded-lg overflow-hidden">
                    <button
                        onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                        className="w-full flex items-center justify-between px-2 py-1.5 bg-black/30 hover:bg-black/40 transition-colors"
                    >
                        <span className="text-xs text-brand-muted flex items-center gap-1.5">
                            {isPromptModified && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Prompt modified" />
                            )}
                            Prompt
                        </span>
                        {isPromptExpanded ? (
                            <ChevronUp size={14} className="text-brand-muted" />
                        ) : (
                            <ChevronDown size={14} className="text-brand-muted" />
                        )}
                    </button>
                    {isPromptExpanded && (
                        <div className="p-2 space-y-2">
                            <textarea
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                                className="w-full h-32 bg-black/50 border border-brand-border rounded-md p-2 text-xs text-white/90 resize-none focus:outline-none focus:border-white/30"
                                placeholder="Enter custom prompt..."
                            />
                            {isPromptModified && (
                                <button
                                    onClick={handleResetPrompt}
                                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                                >
                                    <RotateCcw size={10} />
                                    Reset to default
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={`
                            flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg
                            text-xs font-medium transition-all
                            ${
                                hasImage
                                    ? 'bg-brand-border text-white hover:bg-white/20'
                                    : 'bg-white text-black hover:bg-white/90'
                            }
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                    >
                        <Sparkles size={12} />
                        {hasImage ? 'Regenerate' : 'Generate'}
                    </button>

                    {hasImage && (
                        <button
                            onClick={onDownload}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg
                                bg-brand-border text-white hover:bg-white/20
                                text-xs font-medium transition-all"
                        >
                            <Download size={12} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

function getAspectRatioStyle(aspectRatio: string): React.CSSProperties {
    const ratioMap: Record<string, string> = {
        '16:9': '56.25%', // 9/16 = 0.5625
        '2:3': '150%', // 3/2 = 1.5
        '7:5': '71.43%', // 5/7 = 0.7143
        '3:2': '66.67%', // 2/3 = 0.6667
        '7:4': '57.14%', // 4/7 = 0.5714
        '1:1': '100%',
    };

    return {
        paddingBottom: ratioMap[aspectRatio] || '100%',
        position: 'relative',
    };
}
