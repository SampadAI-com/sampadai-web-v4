
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Philosophy from './components/Philosophy';
import Nudges from './components/Nudges';
import VisualCalm from './components/VisualCalm';
import FinalCTA from './components/FinalCTA';
import StickyFooter from './components/StickyFooter';
import ScrollProgress from './components/ScrollProgress';
import BackgroundShapes from './components/BackgroundShapes';
import { LanguageProvider } from './context/LanguageContext';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'philosophy', 'nudges', 'calm', 'cta'];
      const scrollPos = window.scrollY + window.innerHeight / 2;

      sections.forEach((id, index) => {
        const el = document.getElementById(id);
        if (el && scrollPos >= el.offsetTop && scrollPos < el.offsetTop + el.offsetHeight) {
          setActiveSection(index);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <LanguageProvider>
      <div className="relative min-h-screen">
        <BackgroundShapes />
        <Navbar />
        <ScrollProgress activeIndex={activeSection} />
        
        <main>
          <div id="hero">
            <Hero />
          </div>
          <div id="philosophy">
            <Philosophy />
          </div>
          <div id="nudges">
            <Nudges />
          </div>
          <div id="calm">
            <VisualCalm />
          </div>
          <div id="cta">
            <FinalCTA />
          </div>
        </main>

        <div className="h-40 md:h-20" /> {/* Spacer for footer */}
        <StickyFooter />
      </div>
    </LanguageProvider>
  );
};

export default App;
