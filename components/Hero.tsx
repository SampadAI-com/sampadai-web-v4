
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Hero: React.FC = () => {
  const { messages } = useLanguage();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center pt-20">
      <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <h1 className="text-5xl md:text-8xl font-light leading-tight mb-16 tracking-tight">
          {messages.hero.titleLine1} <br className="hidden md:block"/> {messages.hero.titleLine2}{' '}
          <span className="italic font-normal serif">{messages.hero.titleEmphasis}</span>
        </h1>
        
        <div className="flex flex-col items-center space-y-4 opacity-40 hover:opacity-70 transition-opacity">
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold">{messages.hero.scrollPrompt}</span>
          <div className="animate-bounce">
            <span className="material-icons">keyboard_double_arrow_down</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
