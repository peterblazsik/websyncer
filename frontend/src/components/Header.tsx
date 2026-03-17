import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { X, Menu } from "lucide-react";

export const Header: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/marketing", label: "Marketing" },
    { path: "/branding", label: "Branding" },
    { path: "/batch", label: "Batch" },
    { path: "/webp", label: "WebP" },
    { path: "/heic", label: "HEIC" },
    { path: "/screenshots", label: "Screenshots" },
    { path: "/icons", label: "Icons" },
    { path: "/vectorize", label: "Vectorize" },
  ];

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [mobileMenuOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [mobileMenuOpen]);

  return (
    <header
      className="bg-black sticky top-0 z-50 border-b border-brand-border"
      ref={menuRef}
    >
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

        {/* Desktop Navigation */}
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

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-brand-border bg-black/95 backdrop-blur-sm animate-in slide-in-from-top-2">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-4 py-3 text-sm font-medium uppercase tracking-wide rounded-lg transition-colors ${
                  location.pathname === link.path
                    ? "text-white bg-white/10"
                    : "text-brand-muted hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};
