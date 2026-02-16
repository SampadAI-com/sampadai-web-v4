
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Navbar: React.FC = () => {
  const { language, setLanguage, messages, supportedLanguages } = useLanguage();

  return (
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
        <a href="#philosophy" className="hover:text-primary hover:opacity-100 transition-all cursor-pointer">{messages.navbar.philosophy}</a>
        <a href="#nudges" className="hover:text-primary hover:opacity-100 transition-all cursor-pointer">{messages.navbar.nudge}</a>
        <a href="#" className="hover:text-primary hover:opacity-100 transition-all cursor-pointer">{messages.navbar.safety}</a>
      </div>
      
      <div className="flex shrink-0 items-center gap-2.5 sm:gap-4">
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
          aria-label="Open navigation menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-charcoal/70 transition-colors hover:bg-primary/10 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 md:hidden"
        >
          <span className="material-icons text-[20px] leading-none">menu</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
