
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const Navbar: React.FC = () => {
  const { language, setLanguage, messages, supportedLanguages } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      document.body.style.overflow = '';
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((previous) => !previous);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { href: '#philosophy', label: messages.navbar.philosophy },
    { href: '#nudges', label: messages.navbar.nudge },
    { href: '#', label: messages.navbar.safety },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 border-b border-primary/5 bg-background-light/40 px-4 py-4 luxury-blur sm:gap-4 sm:p-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-none">
          <img
            src="/assets/logo/sampadai.png"
            alt="SampadAI logo"
            className="h-8 w-8 shrink-0 rounded-lg object-cover shadow-lg shadow-primary/20"
          />
          <span className="max-w-[11rem] truncate text-lg font-extrabold leading-none tracking-tight text-charcoal sm:text-xl md:max-w-none">
            SampadAI
          </span>
        </div>

        <div className="hidden md:flex flex-1 justify-center space-x-10 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="hover:text-primary hover:opacity-100 transition-all cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2.5 sm:gap-4">
          <div className="hidden sm:flex items-center whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.16em] leading-none opacity-70 sm:tracking-[0.2em]">
            {supportedLanguages.map((code, index) => (
              <React.Fragment key={code}>
                <button
                  type="button"
                  onClick={() => setLanguage(code)}
                  className={`inline-flex items-center leading-none transition-all ${
                    language === code ? 'text-primary opacity-100' : 'hover:text-primary hover:opacity-100'
                  }`}
                  aria-label={`Switch language to ${code.toUpperCase()}`}
                >
                  {code.toUpperCase()}
                </button>
                {index < supportedLanguages.length - 1 ? (
                  <span className="mx-1.5 inline-flex items-center leading-none opacity-40 sm:mx-2">|</span>
                ) : null}
              </React.Fragment>
            ))}
          </div>

          <button
            type="button"
            aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={toggleMobileMenu}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-charcoal/70 transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              {isMobileMenuOpen ? (
                <path
                  d="M6 6L18 18M18 6L6 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7H20M4 12H20M4 17H20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-[60] md:hidden transition-opacity duration-200 ${
          isMobileMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMobileMenu}
          className="absolute inset-0 bg-charcoal/30"
        />

        <aside
          id="mobile-navigation"
          className={`absolute right-0 top-0 h-full w-[min(84vw,20rem)] border-l border-primary/10 bg-background-light p-6 shadow-2xl transition-transform duration-200 ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/assets/logo/sampadai.png"
                alt="SampadAI logo"
                className="h-7 w-7 rounded-md object-cover shadow-md shadow-primary/10"
              />
              <span className="text-sm font-extrabold uppercase tracking-[0.18em] text-charcoal/70">
                Navigation
              </span>
            </div>
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={closeMobileMenu}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-charcoal/70 transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M6 6L18 18M18 6L6 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-2 text-sm font-bold uppercase tracking-[0.14em] text-charcoal/80">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={closeMobileMenu}
                className="rounded-lg px-3 py-2.5 transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="mt-8 border-t border-primary/10 pt-6">
            <div className="flex items-center gap-2">
              {supportedLanguages.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setLanguage(code);
                    closeMobileMenu();
                  }}
                  className={`rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                    language === code
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-primary/10 text-charcoal/70 hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
};

export default Navbar;
