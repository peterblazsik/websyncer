import React from 'react';
import { Download, FolderOpen } from 'lucide-react';

export type OutputMode = 'download' | 'save';

interface OutputOptionsProps {
    mode: OutputMode;
    onModeChange: (mode: OutputMode) => void;
}

export const OutputOptions: React.FC<OutputOptionsProps> = ({ mode, onModeChange }) => {
    return (
        <div className="flex items-center gap-4">
            <span className="text-sm text-brand-muted">Output:</span>
            <div className="flex gap-2">
                <button
                    onClick={() => onModeChange('download')}
                    className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                        transition-all border
                        ${
                            mode === 'download'
                                ? 'bg-white text-black border-white'
                                : 'bg-transparent text-brand-muted border-brand-border hover:border-white/50 hover:text-white'
                        }
                    `}
                >
                    <Download size={14} />
                    <span>Download ZIP</span>
                </button>

                <button
                    onClick={() => onModeChange('save')}
                    className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                        transition-all border
                        ${
                            mode === 'save'
                                ? 'bg-white text-black border-white'
                                : 'bg-transparent text-brand-muted border-brand-border hover:border-white/50 hover:text-white'
                        }
                    `}
                >
                    <FolderOpen size={14} />
                    <span>Organized ZIP</span>
                </button>
            </div>
        </div>
    );
};
