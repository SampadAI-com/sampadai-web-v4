
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const VisualCalm: React.FC = () => {
  const { messages } = useLanguage();
  const { visualCalm } = messages;

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <div className="relative w-full max-w-6xl group rounded-3xl overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] transition-all duration-700 hover:scale-[1.01]">
        <img 
          alt={visualCalm.imageAlt}
          className="w-full aspect-[16/10] md:aspect-video object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-1000"
          src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2000&auto=format&fit=crop"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent flex items-end p-6 md:p-20">
          <div className="max-w-2xl text-white space-y-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
            <h2 className="text-4xl md:text-6xl font-light leading-tight">
              {visualCalm.headingLine1} <br /> {visualCalm.headingLine2}
            </h2>
            <p className="text-xl md:text-2xl text-white/70 font-light leading-relaxed">
              {visualCalm.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisualCalm;
