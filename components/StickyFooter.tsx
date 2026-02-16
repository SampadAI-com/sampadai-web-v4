
import React from 'react';

const StickyFooter: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-8 pointer-events-none">
      <div className="max-w-5xl mx-auto bg-white/90 luxury-blur rounded-[2rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] border border-primary/10 p-4 md:p-6 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 pointer-events-auto">
        <div className="flex items-center space-x-8 px-4">
          <div className="hidden lg:block">
            <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-black block mb-1">Current Membership</span>
            <span className="text-sm font-bold opacity-80 whitespace-nowrap">Limited Invitations Remaining</span>
          </div>
          
          <div className="h-10 w-px bg-primary/10 hidden lg:block"></div>
          
          <p className="text-sm md:text-base font-medium opacity-70 italic text-center md:text-left leading-tight">
            "The Headspace for your financial life."
          </p>
        </div>

        <div className="flex items-center w-full md:w-auto space-x-2">
          <input 
            className="flex-grow md:w-72 bg-background-light border-none rounded-2xl text-sm px-6 py-4 focus:ring-2 focus:ring-primary/20 placeholder:opacity-30 placeholder:font-medium font-medium transition-all" 
            placeholder="Email address" 
            type="email"
          />
          <button className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-2xl text-sm font-bold tracking-tight transition-all active:scale-95 shadow-xl shadow-primary/20 whitespace-nowrap">
            Join the Waitlist
          </button>
        </div>
      </div>
    </footer>
  );
};

export default StickyFooter;
