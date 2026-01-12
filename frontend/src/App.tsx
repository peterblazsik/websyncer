import { useState } from 'react';
import { Header } from './components/Header';
import { ConfigForm } from './components/ConfigForm';
import { Preview } from './components/Preview';
import { DEFAULT_CONFIG } from './types';
import type { PromptConfig } from './types';

function App() {
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
          // If response is not JSON
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
      link.download = `orthoscan-marketing-${Date.now()}.png`; // Saving to default download location
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed:", e);
      // Fallback for direct link if fetch fails (CORS)
      const link = document.createElement('a');
      link.href = imageUrl;
      link.target = "_blank";
      link.download = "orthoscan-output.png";
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-amazon-page pb-20 font-sans">
      <Header />

      <main className="max-w-[1400px] mx-auto px-4 py-6">

        {/* Breadcrumb style top bar */}
        <div className="flex items-center text-xs text-gray-500 mb-4 bg-white p-2 rounded shadow-sm border border-gray-200">
          <span className="font-bold text-amazon-dark">OrthoScan Marketing</span>
          <span className="mx-2">&rsaquo;</span>
          <span className="text-amazon-blue hover:underline cursor-pointer">Campaign Generator</span>
          <span className="mx-2">&rsaquo;</span>
          <span className="text-gray-700">New Asset</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Config */}
          <div className="lg:col-span-8 space-y-6">
            <ConfigForm config={config} onChange={setConfig} />
          </div>

          {/* Right Column: Action & Preview (Buy Box Style) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Action Card */}
            <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
              <div className="text-red-700 text-lg font-bold mb-2">Create New Asset</div>
              <div className="text-sm text-gray-600 mb-4">
                Ready to generate a high-conversion marketing image powered by
                <span className="font-bold text-amazon-dark"> Nano Banana AI</span>.
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-amazon-button hover:bg-amazon-buttonHover text-amazon-dark text-sm rounded-full py-2 shadow-sm border border-yellow-500 font-normal mb-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing Request...' : 'Generate Asset'}
              </button>

              <div className="text-xs text-center text-gray-500 mt-2">
                <span className="text-amazon-blue cursor-pointer hover:underline">Secure transaction</span>
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
    </div>
  );
}

export default App;
