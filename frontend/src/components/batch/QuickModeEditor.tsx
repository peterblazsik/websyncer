import React from 'react';
import type { BatchAspectRatio } from '../../types/batch';
import { ASPECT_RATIO_OPTIONS } from '../../lib/batchConfig';

interface QuickModeEditorProps {
    text: string;
    onChange: (text: string) => void;
    globalAspectRatio: BatchAspectRatio;
    onAspectRatioChange: (ar: BatchAspectRatio) => void;
    promptCount: number;
}

export const QuickModeEditor: React.FC<QuickModeEditorProps> = ({
    text,
    onChange,
    globalAspectRatio,
    onAspectRatioChange,
    promptCount,
}) => {
    return (
        <div className="space-y-3">
            <textarea
                value={text}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Enter one prompt per line...&#10;&#10;A professional photo of a modern office building at sunset&#10;An abstract geometric pattern in blue and gold&#10;A cozy coffee shop interior with warm lighting"
                className="form-input w-full min-h-[300px] font-mono text-sm leading-relaxed resize-y"
                spellCheck={false}
            />
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <label className="form-label mb-0 text-xs">Aspect Ratio</label>
                    <select
                        value={globalAspectRatio}
                        onChange={(e) =>
                            onAspectRatioChange(e.target.value as BatchAspectRatio)
                        }
                        className="form-select text-sm py-1.5 px-3 w-auto"
                    >
                        {ASPECT_RATIO_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
                <span className="text-sm text-brand-muted">
                    {promptCount} {promptCount === 1 ? 'prompt' : 'prompts'} detected
                </span>
            </div>
        </div>
    );
};
