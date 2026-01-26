import { Link } from "react-router-dom";
import { Sparkles, FileImage, Smartphone, Hexagon, Image } from "lucide-react";

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: string;
}

const tools: Tool[] = [
  {
    id: "marketing",
    title: "Marketing Generator",
    description:
      "AI-powered image generation for marketing campaigns. Create professional assets with custom branding.",
    icon: Sparkles,
    path: "/marketing",
    badge: "AI Powered",
  },
  {
    id: "webp",
    title: "WebP Converter",
    description:
      "Convert PNG images to optimized WebP format with multiple size variants for web and mobile.",
    icon: FileImage,
    path: "/webp",
  },
  {
    id: "screenshots",
    title: "App Store Screenshots",
    description:
      "Generate all required iPhone display sizes for Apple App Store Connect submissions.",
    icon: Smartphone,
    path: "/screenshots",
    badge: "iOS",
  },
  {
    id: "icons",
    title: "App Icon Generator",
    description:
      "Create iOS, macOS app icons and web formats (PNG, WebP, JPG) from a single source image.",
    icon: Hexagon,
    path: "/icons",
    badge: "iOS",
  },
  {
    id: "heic",
    title: "HEIC Converter",
    description:
      "Convert Apple HEIC/HEIF images to JPG or PNG format with quality control.",
    icon: Image,
    path: "/heic",
    badge: "Apple",
  },
];

export function Home() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-bold text-white uppercase tracking-tight mb-4">
          Web<span className="font-light">Syncer</span>
        </h1>
        <p className="text-xl text-brand-muted max-w-2xl mx-auto">
          Convert. Resize. Generate. Free.
        </p>
        <p className="text-brand-muted mt-2">
          Professional image tools for developers and marketers.
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {tools.map((tool) => (
          <Link key={tool.id} to={tool.path} className="group">
            <div className="tool-card h-full">
              <div className="flex items-start justify-between mb-4">
                <tool.icon className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                {tool.badge && (
                  <span className="tool-card-badge">{tool.badge}</span>
                )}
              </div>
              <h3 className="tool-card-title">{tool.title}</h3>
              <p className="tool-card-description">{tool.description}</p>
              <div className="mt-4 flex items-center text-white text-sm font-medium uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Open Tool</span>
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer Info */}
      <div className="text-center mt-16 text-brand-muted text-sm">
        <p>All processing runs locally in your browser. No uploads required.</p>
        <p className="mt-1">Free and open source.</p>
      </div>
    </main>
  );
}
