import { useState, useMemo } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { Header } from "./components/Header";
import { KeyboardShortcutsHelp } from "./components/KeyboardShortcutsHelp";
import { HistoryPanel } from "./components/HistoryPanel";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useHistory } from "./hooks/useHistory";
import { Home } from "./pages/Home";
import { MarketingGenerator } from "./pages/MarketingGenerator";
import { WebPConverter } from "./pages/WebPConverter";
import { Screenshots } from "./pages/Screenshots";
import { IconGenerator } from "./pages/IconGenerator";
import { BrandingGenerator } from "./pages/BrandingGenerator";
import { HeicConverter } from "./pages/HeicConverter";
import { BatchGenerator } from "./pages/BatchGenerator";
import { Vectorize } from "./pages/Vectorize";

function AppContent() {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { entries: historyEntries, clearHistory } = useHistory();

  const shortcuts = useMemo(
    () => [
      {
        key: "?",
        handler: () => setShowShortcuts((s) => !s),
        description: "Toggle shortcuts help",
      },
      {
        key: "Escape",
        handler: () => setShowShortcuts(false),
        description: "Close shortcuts help",
      },
    ],
    [],
  );

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="min-h-screen bg-brand-light font-sans text-brand-text">
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1a1a1a",
            border: "1px solid #333",
            color: "#e0e0e0",
            fontSize: "13px",
          },
        }}
        richColors
      />
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/marketing" element={<MarketingGenerator />} />
        <Route path="/webp" element={<WebPConverter />} />
        <Route path="/screenshots" element={<Screenshots />} />
        <Route path="/icons" element={<IconGenerator />} />
        <Route path="/branding" element={<BrandingGenerator />} />
        <Route path="/heic" element={<HeicConverter />} />
        <Route path="/batch" element={<BatchGenerator />} />
        <Route path="/vectorize" element={<Vectorize />} />
      </Routes>

      <HistoryPanel entries={historyEntries} onClear={clearHistory} />

      {showShortcuts && (
        <KeyboardShortcutsHelp onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
