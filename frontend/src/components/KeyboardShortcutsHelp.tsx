import React from "react";
import { X } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  onClose: () => void;
}

const shortcuts = [
  { keys: ["?"], description: "Show keyboard shortcuts" },
  { keys: ["Esc"], description: "Close modal / lightbox / menu" },
  { keys: ["+", "-"], description: "Zoom in / out (lightbox)" },
  { keys: ["0"], description: "Reset zoom (lightbox)" },
];

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-brand-card border border-brand-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Keyboard Shortcuts</h3>
          <button
            onClick={onClose}
            className="text-brand-muted hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map((shortcut, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-brand-muted">
                {shortcut.description}
              </span>
              <div className="flex gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="px-2 py-1 bg-black border border-brand-border rounded text-xs text-white font-mono"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-brand-border text-center">
          <p className="text-xs text-brand-muted">
            Press{" "}
            <kbd className="px-1.5 py-0.5 bg-black border border-brand-border rounded text-xs text-white font-mono">
              ?
            </kbd>{" "}
            anytime to show this
          </p>
        </div>
      </div>
    </div>
  );
};
