import React, { useState } from "react";
import { Download, Terminal, Maximize2 } from "lucide-react";
import { Lightbox } from "./Lightbox";

interface PreviewProps {
  loading: boolean;
  imageUrl: string | null;
  debugPrompt: string | null;
  onDownload: () => void;
}

export const Preview: React.FC<PreviewProps> = ({
  loading,
  imageUrl,
  debugPrompt,
  onDownload,
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-4">Asset Preview</h3>
        <div className="bg-black/50 border border-brand-border rounded-xl overflow-hidden aspect-square flex items-center justify-center relative group">
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              <p className="text-brand-muted text-sm font-medium animate-pulse">
                Generating Asset...
              </p>
            </div>
          ) : imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt="Generated Marketing Asset"
                className="w-full h-full object-contain cursor-pointer"
                onClick={() => setLightboxOpen(true)}
              />
              <button
                onClick={() => setLightboxOpen(true)}
                className="absolute top-3 right-3 p-2 rounded-lg bg-black/60 text-white/80 hover:bg-black/80 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="View fullscreen"
              >
                <Maximize2 size={16} />
              </button>
            </>
          ) : (
            <div className="relative text-brand-muted text-center p-8 flex flex-col items-center justify-center">
              <img
                src="/assets/generated/empty-generate.jpg"
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none"
              />
              <p className="text-sm relative z-10">Preview will appear here</p>
            </div>
          )}
        </div>

        {imageUrl && (
          <button
            onClick={onDownload}
            className="mt-6 w-full bg-white hover:bg-white/90 text-black font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Download size={18} /> Download High-Res
          </button>
        )}
      </div>

      {debugPrompt && (
        <div className="card text-xs">
          <div className="flex items-center gap-2 text-brand-muted mb-3 font-bold uppercase tracking-wider">
            <Terminal size={12} />
            <span>Prompt Debug</span>
          </div>
          <div className="bg-black p-4 rounded-lg border border-brand-border text-gray-300 font-mono overflow-x-auto">
            <pre className="whitespace-pre-wrap">{debugPrompt}</pre>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && imageUrl && (
        <Lightbox
          imageUrl={imageUrl}
          alt="Generated Marketing Asset"
          onClose={() => setLightboxOpen(false)}
          onDownload={onDownload}
        />
      )}
    </div>
  );
};
