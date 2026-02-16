
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const FinalCTA: React.FC = () => {
  const { messages } = useLanguage();
  const { finalCta } = messages;

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center space-y-12">
      <div className="max-w-3xl space-y-10 animate-in fade-in duration-1000 delay-300">
        <h2 className="text-4xl md:text-7xl font-light leading-tight tracking-tight">
          {finalCta.headingLine1} <br className="hidden md:block" /> {finalCta.headingLine2}
        </h2>
        <p className="text-xl md:text-2xl opacity-50 font-light">
          {finalCta.descriptionLine1} <br className="hidden md:block" /> {finalCta.descriptionLine2}
        </p>
        
        <div className="flex justify-center pt-8">
          <div className="w-20 h-20 rounded-full border border-primary/20 flex items-center justify-center text-primary group hover:border-primary transition-colors cursor-pointer animate-float">
            <span className="material-icons text-3xl group-hover:translate-y-2 transition-transform">arrow_downward</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
