import { handleInternalLinkClick } from '../utils/router';

export default function Footer() {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    handleInternalLinkClick(e, path);
  };

  return (
    <footer className="bg-gradient-to-b from-[var(--bg-primary)] to-[#08090B] border-t border-subtle">
      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="text-lg font-medium text-[var(--text-primary)] mb-4 opacity-90">Unspendify</div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed opacity-80">
              Track your SaaS subscriptions without another login
            </p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4 opacity-80">Product</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/how-it-works"
                  onClick={(e) => handleLinkClick(e, '/how-it-works')}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300 opacity-75 hover:opacity-100"
                >
                  How it works
                </a>
              </li>
              <li>
                <a
                  href="/pricing"
                  onClick={(e) => handleLinkClick(e, '/pricing')}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300 opacity-75 hover:opacity-100"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="/security"
                  onClick={(e) => handleLinkClick(e, '/security')}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300 opacity-75 hover:opacity-100"
                >
                  Security
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  onClick={(e) => handleLinkClick(e, '/about')}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300 opacity-75 hover:opacity-100"
                >
                  About
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4 opacity-80">Legal</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/privacy"
                  onClick={(e) => handleLinkClick(e, '/privacy')}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300 opacity-75 hover:opacity-100"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => handleLinkClick(e, '/terms')}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300 opacity-75 hover:opacity-100"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4 opacity-80">Contact</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:hello@unspendify.com"
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-300 opacity-75 hover:opacity-100"
                >
                  hello@unspendify.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-subtle">
          <p className="text-sm text-[var(--text-muted)] opacity-60">
            © 2024 Unspendify. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
