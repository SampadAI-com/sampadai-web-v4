
import React from 'react';

const FinalCTA: React.FC = () => {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center space-y-12">
      <div className="max-w-3xl space-y-10 animate-in fade-in duration-1000 delay-300">
        <h2 className="text-4xl md:text-7xl font-light leading-tight tracking-tight">
          Ready to change your <br className="hidden md:block" /> relationship with money?
        </h2>
        <p className="text-xl md:text-2xl opacity-50 font-light">
          Join 15,000+ women who are redefining what it means <br className="hidden md:block" /> to be financially secure.
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
