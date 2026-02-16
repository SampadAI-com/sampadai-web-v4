
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const Navbar: React.FC = () => {
  const { language, setLanguage, messages, supportedLanguages } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

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
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((previous) => !previous);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {isMobileMenuOpen ? (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-charcoal/15 md:hidden"
        />
      ) : null}

      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 border-b border-primary/5 bg-background-light/40 px-4 py-4 luxury-blur sm:gap-4 sm:p-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-none">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
            <span className="text-lg font-bold leading-none text-white">S</span>
          </div>
          <span className="max-w-[11rem] truncate text-lg font-extrabold leading-none tracking-tight text-charcoal sm:text-xl md:max-w-none">
            Sampadai
          </span>
        </div>

        <div className="hidden md:flex flex-1 justify-center space-x-10 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
          <a
            href="#philosophy"
            className="hover:text-primary hover:opacity-100 transition-all cursor-pointer"
          >
            {messages.navbar.philosophy}
          </a>
          <a href="#nudges" className="hover:text-primary hover:opacity-100 transition-all cursor-pointer">
            {messages.navbar.nudge}
          </a>
          <a href="#" className="hover:text-primary hover:opacity-100 transition-all cursor-pointer">
            {messages.navbar.safety}
          </a>
        </div>

        <div className="relative flex shrink-0 items-center gap-2.5 sm:gap-4">
          <div className="flex items-center whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.16em] leading-none opacity-70 sm:tracking-[0.2em]">
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
            {isMobileMenuOpen ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M6 6L18 18M18 6L6 18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M4 7H20M4 12H20M4 17H20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>

          <div
            id="mobile-navigation"
            className={`absolute right-0 top-[calc(100%+0.75rem)] w-56 rounded-2xl border border-primary/10 bg-background-light/95 p-4 shadow-xl transition-all duration-200 md:hidden ${
              isMobileMenuOpen
                ? 'pointer-events-auto translate-y-0 opacity-100'
                : 'pointer-events-none -translate-y-2 opacity-0'
            }`}
          >
            <div className="flex flex-col gap-3 text-[11px] font-bold uppercase tracking-[0.14em] text-charcoal/80">
              <a
                href="#philosophy"
                onClick={closeMobileMenu}
                className="rounded-lg px-2 py-1.5 transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {messages.navbar.philosophy}
              </a>
              <a
                href="#nudges"
                onClick={closeMobileMenu}
                className="rounded-lg px-2 py-1.5 transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {messages.navbar.nudge}
              </a>
              <a
                href="#"
                onClick={closeMobileMenu}
                className="rounded-lg px-2 py-1.5 transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {messages.navbar.safety}
              </a>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
