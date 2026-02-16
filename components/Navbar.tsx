
import React from 'react';

const Navbar: React.FC = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center luxury-blur bg-background-light/40 border-b border-primary/5">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="text-white font-bold text-lg">S</span>
        </div>
        <span className="text-xl font-extrabold tracking-tight text-charcoal">Sampadai</span>
      </div>
      
      <div className="hidden md:flex space-x-10 text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
        <a href="#philosophy" className="hover:text-primary hover:opacity-100 transition-all cursor-pointer">Our Philosophy</a>
        <a href="#nudges" className="hover:text-primary hover:opacity-100 transition-all cursor-pointer">The Nudge</a>
        <a href="#" className="hover:text-primary hover:opacity-100 transition-all cursor-pointer">Safety</a>
      </div>
      
      <div className="md:hidden">
        <span className="material-icons opacity-60">menu</span>
      </div>
    </nav>
  );
};

export default Navbar;
