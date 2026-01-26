import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Home } from "./pages/Home";
import { MarketingGenerator } from "./pages/MarketingGenerator";
import { WebPConverter } from "./pages/WebPConverter";
import { Screenshots } from "./pages/Screenshots";
import { IconGenerator } from "./pages/IconGenerator";
import { BrandingGenerator } from "./pages/BrandingGenerator";
import { HeicConverter } from "./pages/HeicConverter";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-brand-light font-sans text-brand-text">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/marketing" element={<MarketingGenerator />} />
          <Route path="/webp" element={<WebPConverter />} />
          <Route path="/screenshots" element={<Screenshots />} />
          <Route path="/icons" element={<IconGenerator />} />
          <Route path="/branding" element={<BrandingGenerator />} />
          <Route path="/heic" element={<HeicConverter />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
