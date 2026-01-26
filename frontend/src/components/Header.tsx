import React from "react";
import { Link, useLocation } from "react-router-dom";

export const Header: React.FC = () => {
  const location = useLocation();

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/marketing", label: "Marketing" },
    { path: "/branding", label: "Branding" },
    { path: "/webp", label: "WebP" },
    { path: "/heic", label: "HEIC" },
    { path: "/screenshots", label: "Screenshots" },
    { path: "/icons", label: "Icons" },
  ];

  return (
    <header className="bg-black sticky top-0 z-50 border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo Area */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/assets/websyncer-logo.png"
            alt="WebSyncer"
            className="h-8 w-8 rounded-lg"
          />
          <span className="text-2xl font-bold text-white uppercase tracking-tight">
            Web
            <span className="font-light" style={{ color: "#fa642c" }}>
              Syncer
            </span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`px-4 py-2 text-sm font-medium uppercase tracking-wide transition-colors rounded ${
                location.pathname === link.path
                  ? "text-white bg-white/10"
                  : "text-brand-muted hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Menu Button (optional - can be expanded later) */}
        <button className="md:hidden text-white p-2">
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    </header>
  );
};
