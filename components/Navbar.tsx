
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Navbar: React.FC = () => {
  const { language, setLanguage, messages, supportedLanguages } = useLanguage();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4 sm:p-6 flex items-center gap-4 luxury-blur bg-background-light/40 border-b border-primary/5">
      <div className="flex items-center space-x-2 shrink-0">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="text-white font-bold text-lg">S</span>
        </div>
        <span className="text-xl font-extrabold tracking-tight text-charcoal">Sampadai</span>
      </div>
      
      <div className="hidden md:flex flex-1 justify-center space-x-10 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
        <a href="#philosophy" className="hover:text-primary hover:opacity-100 transition-all cursor-pointer">{messages.navbar.philosophy}</a>
        <a href="#nudges" className="hover:text-primary hover:opacity-100 transition-all cursor-pointer">{messages.navbar.nudge}</a>
        <a href="#" className="hover:text-primary hover:opacity-100 transition-all cursor-pointer">{messages.navbar.safety}</a>
      </div>
      
      <div className="ml-auto flex items-center space-x-2 sm:space-x-4 shrink-0">
        <div className="flex items-center whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">
          {supportedLanguages.map((code, index) => (
            <React.Fragment key={code}>
              <button
                type="button"
                onClick={() => setLanguage(code)}
                className={`transition-all ${
                  language === code ? 'text-primary opacity-100' : 'hover:text-primary hover:opacity-100'
                }`}
                aria-label={`Switch language to ${code.toUpperCase()}`}
              >
                {code.toUpperCase()}
              </button>
              {index < supportedLanguages.length - 1 ? (
                <span className="mx-1.5 sm:mx-2 opacity-40">|</span>
              ) : null}
            </React.Fragment>
          ))}
        </div>

        <div className="md:hidden">
          <span className="material-icons opacity-60">menu</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
