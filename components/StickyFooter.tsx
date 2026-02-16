
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const StickyFooter: React.FC = () => {
  const { messages } = useLanguage();
  const { stickyFooter } = messages;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 md:p-8 pointer-events-none">
      <div className="max-w-5xl mx-auto bg-white/90 luxury-blur rounded-[2rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] border border-primary/10 p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 pointer-events-auto">
        <div className="w-full md:w-auto flex items-center justify-center md:justify-start gap-8 px-2 sm:px-4">
          <div className="hidden lg:block">
            <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-black block mb-1">
              {stickyFooter.membershipLabel}
            </span>
            <span className="text-sm font-bold opacity-80 whitespace-nowrap">{stickyFooter.membershipValue}</span>
          </div>
          
          <div className="h-10 w-px bg-primary/10 hidden lg:block"></div>
          
          <p className="max-w-xl text-sm md:text-base font-medium opacity-70 italic text-center md:text-left leading-tight">
            {stickyFooter.quote}
          </p>
        </div>

        <div className="w-full md:w-auto flex flex-col items-center sm:items-center sm:flex-row sm:justify-center md:justify-end gap-2">
          <input 
            className="w-full max-w-md sm:max-w-none sm:flex-grow md:w-72 bg-background-light border-none rounded-2xl text-sm px-4 sm:px-6 py-3 sm:py-4 focus:ring-2 focus:ring-primary/20 placeholder:opacity-30 placeholder:font-medium font-medium transition-all min-w-0" 
            placeholder={stickyFooter.emailPlaceholder}
            type="email"
          />
          <button className="w-full max-w-md sm:w-auto bg-primary hover:bg-primary/90 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-sm font-bold tracking-tight transition-all active:scale-95 shadow-xl shadow-primary/20 whitespace-nowrap">
            {stickyFooter.waitlistButton}
          </button>
        </div>
      </div>
    </footer>
  );
};

export default StickyFooter;
