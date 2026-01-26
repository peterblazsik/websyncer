import React from 'react';
import { Download, Terminal } from 'lucide-react';

interface PreviewProps {
    loading: boolean;
    imageUrl: string | null;
    debugPrompt: string | null;
    onDownload: () => void;
}

export const Preview: React.FC<PreviewProps> = ({ loading, imageUrl, debugPrompt, onDownload }) => {
    return (
        <div className="space-y-6">
            <div className="bg-white border border-white rounded-2xl p-6 shadow-xl shadow-brand-dark/5">
                <h3 className="text-lg font-bold text-brand-dark mb-4">Asset Preview</h3>
                <div className="bg-gray-50 border border-gray-100 rounded-xl overflow-hidden aspect-square flex items-center justify-center relative group">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-brand-text text-sm font-medium animate-pulse">Generating Asset...</p>
                        </div>
                    ) : imageUrl ? (
                        <>
                            <img src={imageUrl} alt="Generated Marketing Asset" className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                {/* Hover Overlay */}
                            </div>
                        </>
                    ) : (
                        <div className="text-gray-400 text-center p-8">
                            <p className="text-sm">Preview will appear here</p>
                        </div>
                    )}
                </div>

                {imageUrl && (
                    <button
                        onClick={onDownload}
                        className="mt-6 w-full bg-brand-light hover:bg-brand-primary hover:text-white text-brand-primary font-medium py-3 px-4 rounded-xl shadow-sm border border-brand-primary/20 hover:border-brand-primary transition-all flex items-center justify-center gap-2"
                    >
                        <Download size={18} /> Download High-Res
                    </button>
                )}
            </div>

            {debugPrompt && (
                <div className="bg-white border border-white rounded-xl p-4 text-xs shadow-lg shadow-brand-dark/5">
                    <div className="flex items-center gap-2 text-brand-primary mb-3 font-bold uppercase tracking-wider">
                        <Terminal size={12} />
                        <span>Prompt Debug</span>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 text-gray-300 font-mono overflow-x-auto">
                        <pre className="whitespace-pre-wrap">{debugPrompt}</pre>
                    </div>
                </div>
            )}
        </div>
    );
};
