import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { handleInternalLinkClick } from '../utils/router';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activePath, setActivePath] = useState(window.location.pathname);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    const handleLocationChange = () => {
      setActivePath(window.location.pathname);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    handleInternalLinkClick(e, path);
    setMobileMenuOpen(false);
    setActivePath(path);
  };

  const isActive = (path: string) => activePath === path;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'backdrop-blur-soft nav-glow'
        : 'bg-transparent'
    }`}>
      <div className="max-w-[1100px] mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, '/')}
              className="text-lg font-medium text-[var(--text-primary)] tracking-tight hover:opacity-70 transition-opacity duration-300"
            >
              Unspendify
            </a>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, '/')}
              className={`text-sm transition-all duration-300 relative ${
                isActive('/')
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Home
              {isActive('/') && (
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-[var(--accent)] opacity-60" />
              )}
            </a>
            <a
              href="/how-it-works"
              onClick={(e) => handleLinkClick(e, '/how-it-works')}
              className={`text-sm transition-all duration-300 relative ${
                isActive('/how-it-works')
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              How it works
              {isActive('/how-it-works') && (
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-[var(--accent)] opacity-60" />
              )}
            </a>
            <a
              href="/getting-started"
              onClick={(e) => handleLinkClick(e, '/getting-started')}
              className={`text-sm transition-all duration-300 relative ${
                isActive('/getting-started')
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Getting Started
              {isActive('/getting-started') && (
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-[var(--accent)] opacity-60" />
              )}
            </a>
            <a
              href="/pricing"
              onClick={(e) => handleLinkClick(e, '/pricing')}
              className={`text-sm transition-all duration-300 relative ${
                isActive('/pricing')
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Pricing
              {isActive('/pricing') && (
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-[var(--accent)] opacity-60" />
              )}
            </a>
            <a
              href="/security"
              onClick={(e) => handleLinkClick(e, '/security')}
              className={`text-sm transition-all duration-300 relative ${
                isActive('/security')
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Security
              {isActive('/security') && (
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-[var(--accent)] opacity-60" />
              )}
            </a>
            <a
              href="/about"
              onClick={(e) => handleLinkClick(e, '/about')}
              className={`text-sm transition-all duration-300 relative ${
                isActive('/about')
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              About
              {isActive('/about') && (
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-[var(--accent)] opacity-60" />
              )}
            </a>
            <a
              href="/signup"
              className="px-5 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--accent)] rounded-lg glow-subtle hover:glow-hover hover:brightness-110 transition-all duration-300"
            >
              Start free
            </a>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-subtle bg-[var(--bg-secondary)]/95 backdrop-blur-sm animate-[fadeIn_200ms_ease-out]">
          <div className="px-6 py-6 space-y-4">
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, '/')}
              className={`block text-sm transition-colors duration-300 ${
                isActive('/')
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Home
            </a>
            <a
              href="/how-it-works"
              onClick={(e) => handleLinkClick(e, '/how-it-works')}
              className={`block text-sm transition-colors duration-300 ${
                isActive('/how-it-works')
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              How it works
            </a>
            <a
              href="/getting-started"
              onClick={(e) => handleLinkClick(e, '/getting-started')}
              className={`block text-sm transition-colors duration-300 ${
                isActive('/getting-started')
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Getting Started
            </a>
            <a
              href="/pricing"
              onClick={(e) => handleLinkClick(e, '/pricing')}
              className={`block text-sm transition-colors duration-300 ${
                isActive('/pricing')
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Pricing
            </a>
            <a
              href="/security"
              onClick={(e) => handleLinkClick(e, '/security')}
              className={`block text-sm transition-colors duration-300 ${
                isActive('/security')
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Security
            </a>
            <a
              href="/about"
              onClick={(e) => handleLinkClick(e, '/about')}
              className={`block text-sm transition-colors duration-300 ${
                isActive('/about')
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              About
            </a>
            <a
              href="/signup"
              className="block w-full px-5 py-3 text-sm font-medium text-center text-[var(--text-primary)] bg-[var(--accent)] rounded-lg glow-subtle hover:glow-hover transition-all duration-300"
            >
              Start free
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
