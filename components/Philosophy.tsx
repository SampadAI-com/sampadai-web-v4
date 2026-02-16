
import React from 'react';

const Philosophy: React.FC = () => {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 py-24">
      <div className="max-w-3xl text-center space-y-16">
        <div className="w-24 h-24 bg-sage/20 rounded-full mx-auto flex items-center justify-center animate-float">
          <span className="material-icons text-sage text-5xl">spa</span>
        </div>
        
        <div className="space-y-10">
          <p className="text-3xl md:text-5xl font-light leading-snug">
            Most financial apps focus on <span className="text-primary font-semibold underline decoration-primary/20 decoration-4 underline-offset-8">transactions</span>. We focus on how those transactions affect your <span className="italic">well-being</span>.
          </p>
          
          <p className="text-xl md:text-2xl opacity-60 font-light leading-relaxed max-w-2xl mx-auto">
            Money isn't just numbers. It's the breath you take when you know you're covered. It's the freedom to say "no" to things that drain you.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Philosophy;
