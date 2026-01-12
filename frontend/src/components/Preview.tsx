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
        <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded p-4 shadow-sm">
                <h3 className="text-lg font-bold text-amazon-dark mb-2">Asset Preview</h3>
                <div className="bg-gray-100 border border-gray-300 rounded overflow-hidden aspect-square flex items-center justify-center relative group">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-amazon-button border-t-amazon-light rounded-full animate-spin"></div>
                            <p className="text-amazon-dark text-sm font-medium animate-pulse">Generating...</p>
                        </div>
                    ) : imageUrl ? (
                        <>
                            <img src={imageUrl} alt="Generated Marketing Asset" className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
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
                        className="mt-4 w-full bg-amazon-button hover:bg-amazon-buttonHover text-amazon-dark font-normal py-2 px-4 rounded-md shadow-sm text-sm border border-yellow-500 flex items-center justify-center gap-2"
                    >
                        <Download size={16} /> Download High-Res
                    </button>
                )}
            </div>

            {debugPrompt && (
                <div className="bg-white border border-gray-200 rounded p-4 text-xs shadow-sm">
                    <div className="flex items-center gap-2 text-amazon-blue mb-2 font-bold uppercase tracking-wider">
                        <Terminal size={12} />
                        <span>Prompt Debug</span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded border border-gray-100 text-gray-600 font-mono overflow-x-auto">
                        <pre className="whitespace-pre-wrap">{debugPrompt}</pre>
                    </div>
                </div>
            )}
        </div>
    );
};
