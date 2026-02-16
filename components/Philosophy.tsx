
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const Philosophy: React.FC = () => {
  const { messages } = useLanguage();
  const { philosophy } = messages;

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20 md:py-24">
      <div className="max-w-3xl text-center space-y-16">
        <div className="w-24 h-24 bg-sage/20 rounded-full mx-auto flex items-center justify-center animate-float">
          <span className="material-icons text-sage text-5xl">spa</span>
        </div>
        
        <div className="space-y-10">
          <p className="text-3xl md:text-5xl font-light leading-snug">
            {philosophy.line1PartBeforeHighlight}
            <span className="text-primary font-semibold underline decoration-primary/20 decoration-4 underline-offset-8">
              {philosophy.line1Highlight}
            </span>
            {philosophy.line1PartBetween}
            <span className="italic">{philosophy.line1Emphasis}</span>
            {philosophy.line1PartAfterEmphasis}
          </p>
          
          <p className="text-xl md:text-2xl opacity-60 font-light leading-relaxed max-w-2xl mx-auto">
            {philosophy.line2}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Philosophy;
