
import React from 'react';

const ScrollProgress: React.FC<{ activeIndex: number }> = ({ activeIndex }) => {
  return (
    <div className="fixed right-10 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col space-y-6">
      {[0, 1, 2, 3, 4].map((idx) => (
        <div 
          key={idx}
          className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
            activeIndex === idx 
              ? 'bg-primary scale-[2] ring-4 ring-primary/10' 
              : 'bg-primary/20 scale-100 hover:bg-primary/40'
          }`}
        />
      ))}
    </div>
  );
};

export default ScrollProgress;
