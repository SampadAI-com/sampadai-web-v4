
import React from 'react';

const BackgroundShapes: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute top-[-15%] left-[-10%] w-[800px] h-[800px] bg-sage/5 organic-blob-1 blur-3xl animate-pulse duration-[10s]"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[900px] h-[900px] bg-coral/5 organic-blob-2 blur-3xl animate-pulse duration-[12s]"></div>
      
      {/* Subtle floating particles */}
      <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-primary/10 blur-xl animate-float"></div>
      <div className="absolute top-3/4 right-1/3 w-8 h-8 rounded-full bg-coral/10 blur-xl animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-1/4 left-1/3 w-6 h-6 rounded-full bg-sage/10 blur-xl animate-float" style={{ animationDelay: '4s' }}></div>
    </div>
  );
};

export default BackgroundShapes;
