
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Philosophy from './components/Philosophy';
import Nudges from './components/Nudges';
import VisualCalm from './components/VisualCalm';
import FinalCTA from './components/FinalCTA';
import LeakCalculatorPage from './components/LeakCalculatorPage';
import ScrollProgress from './components/ScrollProgress';
import BackgroundShapes from './components/BackgroundShapes';
import { LanguageProvider } from './context/LanguageContext';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState(0);
  const [isLeakPage, setIsLeakPage] = useState(() => window.location.hash === '#/leak');

  useEffect(() => {
    const handleHashChange = () => {
      setIsLeakPage(window.location.hash === '#/leak');
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (isLeakPage) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return undefined;
    }

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
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLeakPage]);

  useEffect(() => {
    if (isLeakPage) {
      return;
    }

    const hash = window.location.hash;
    if (!hash || hash === '#') {
      return;
    }

    const targetId = hash.replace('#', '');
    if (!targetId || targetId === '/leak') {
      return;
    }

    requestAnimationFrame(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }, [isLeakPage]);

  return (
    <LanguageProvider>
      <div className="relative min-h-screen">
        <BackgroundShapes />
        <Navbar isLeakPage={isLeakPage} />
        {!isLeakPage ? <ScrollProgress activeIndex={activeSection} /> : null}
        
        <main>
          {isLeakPage ? (
            <LeakCalculatorPage />
          ) : (
            <>
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
            </>
          )}
        </main>
      </div>
    </LanguageProvider>
  );
};

export default App;
