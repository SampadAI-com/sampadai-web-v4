
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Hero: React.FC = () => {
  const { messages } = useLanguage();

  return (
    <section className="relative min-h-screen flex flex-col items-center px-6 text-center pt-24 pb-10">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-5xl md:text-8xl font-light leading-tight mb-10 tracking-tight">
            {messages.hero.titleLine1} <br className="hidden md:block"/> {messages.hero.titleLine2}{' '}
            <span className="italic font-normal serif">{messages.hero.titleEmphasis}</span>
          </h1>
          <div className="flex flex-col items-center space-y-3 opacity-40 hover:opacity-70 transition-opacity">
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold">
              {messages.hero.scrollPrompt}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center space-y-4">
        <a
          href="#/leak"
          className="inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-white shadow-xl shadow-primary/25 transition hover:bg-primary/90 animate-bounce"
        >
          {messages.hero.buttonLabel}
        </a>
        <div className="animate-bounce opacity-40 hover:opacity-70 transition-opacity">
          <span className="material-icons">keyboard_double_arrow_down</span>
        </div>
      </div>
    </section>
  );
};

export default Hero;
