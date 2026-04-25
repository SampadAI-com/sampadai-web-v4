import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import LeakCalculator from './LeakCalculator';
import SupportedBanks from './SupportedBanks';

const LeakCalculatorPage: React.FC = () => {
  const { messages } = useLanguage();
  const { leakPage } = messages;

  return (
    <main className="pt-24 sm:pt-28 pb-16">
      <section className="px-6 sm:px-10 pb-4 sm:pb-6">
        <div className="mx-auto max-w-5xl text-center space-y-6">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-light tracking-tight">
            {leakPage.titleLine1} <br className="hidden sm:block" /> {leakPage.titleLine2}
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-charcoal/60">
            {leakPage.description}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary/60">
            <a
              href="#hero"
              className="rounded-full border border-primary/20 px-4 py-2 transition hover:border-primary/40 hover:text-primary"
            >
              {leakPage.backLink}
            </a>
            <span className="hidden sm:inline text-primary/30">•</span>
            <span className="text-center">{leakPage.reassurance}</span>
          </div>
        </div>
      </section>

      <SupportedBanks />

      <LeakCalculator />

      <section className="px-6 sm:px-10">
        <div className="mx-auto max-w-4xl rounded-2xl border border-primary/10 bg-white/70 p-6 sm:p-8 text-center shadow-[0_20px_50px_-30px_rgba(0,0,0,0.15)]">
          <p className="text-sm sm:text-base text-charcoal/60">{leakPage.footerNote}</p>
        </div>
      </section>
    </main>
  );
};

export default LeakCalculatorPage;
