import React, { useState } from "react";
import { History, X, Trash2, ChevronRight } from "lucide-react";
import type { HistoryEntry } from "../hooks/useHistory";
import { Lightbox } from "./Lightbox";

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onClear: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  entries,
  onClear,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (entries.length === 0) return null;

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const toolLabels: Record<string, string> = {
    marketing: "Marketing",
    branding: "Branding",
    batch: "Batch",
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-card border border-brand-border shadow-lg hover:bg-white/10 transition-colors text-sm text-white"
        aria-label="Toggle generation history"
      >
        <History size={16} />
        <span className="font-medium">{entries.length}</span>
        <ChevronRight
          size={14}
          className={`transition-transform ${isOpen ? "rotate-90" : ""}`}
        />
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-40 w-80 max-h-[60vh] bg-brand-card border border-brand-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-brand-border">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History size={14} />
              Recent Generations
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={onClear}
                className="p-1.5 rounded-lg text-brand-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                aria-label="Clear history"
                title="Clear history"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-brand-muted hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Entries */}
          <div className="flex-1 overflow-y-auto">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 p-3 border-b border-brand-border hover:bg-white/5 transition-colors cursor-pointer"
                onClick={() => setLightboxUrl(entry.imageUrl)}
              >
                <img
                  src={entry.imageUrl}
                  alt="Generated"
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-brand-border"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-white/70 bg-white/10 px-1.5 py-0.5 rounded">
                      {toolLabels[entry.tool] || entry.tool}
                    </span>
                    <span className="text-xs text-brand-muted">
                      {formatTime(entry.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-brand-muted line-clamp-2 leading-relaxed">
                    {entry.prompt.length > 80
                      ? entry.prompt.slice(0, 80) + "..."
                      : entry.prompt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <Lightbox
          imageUrl={lightboxUrl}
          alt="History image"
          onClose={() => setLightboxUrl(null)}
        />
      )}
    </>
  );
};
