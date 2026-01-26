import { useState } from 'react';
import { ConfigForm } from '../components/ConfigForm';
import { Preview } from '../components/Preview';
import { DEFAULT_CONFIG } from '../types';
import type { PromptConfig } from '../types';

export function MarketingGenerator() {
    const [config, setConfig] = useState<PromptConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [debugPrompt, setDebugPrompt] = useState<string | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setDebugPrompt(null);
        setImageUrl(null);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
            const response = await fetch(`${apiUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config),
            });

            if (!response.ok) {
                let errorMessage = 'Generation failed';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    errorMessage = `Server Error: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            setImageUrl(data.imageUrl);
            setDebugPrompt(data.prompt);
        } catch (error: any) {
            console.error(error);
            alert(error.message || 'Failed to generate image. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!imageUrl) return;

        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `websyncer-marketing-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Download failed:', e);
            const link = document.createElement('a');
            link.href = imageUrl;
            link.target = '_blank';
            link.download = 'websyncer-output.png';
            link.click();
        }
    };

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header Section */}
            <div className="mb-8">
                <h1 className="section-title">Marketing Generator</h1>
                <p className="section-subtitle max-w-2xl">
                    Create high-conversion marketing assets with AI-powered image generation.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Config */}
                <div className="lg:col-span-7 space-y-6">
                    <ConfigForm config={config} onChange={setConfig} />
                </div>

                {/* Right Column: Preview & Action (Sticky) */}
                <div className="lg:col-span-5 space-y-6 sticky top-24">
                    {/* Generate Action Card */}
                    <div className="card">
                        <h3 className="text-lg font-bold text-white uppercase mb-4">
                            Generate New Asset
                        </h3>

                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg
                                        className="animate-spin h-5 w-5"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <span>Generate Asset</span>
                            )}
                        </button>
                        <div className="text-xs text-center text-brand-muted mt-3">
                            Estimated time: 10-15 seconds
                        </div>
                    </div>

                    <Preview
                        loading={loading}
                        imageUrl={imageUrl}
                        debugPrompt={debugPrompt}
                        onDownload={handleDownload}
                    />
                </div>
            </div>
        </main>
    );
}
