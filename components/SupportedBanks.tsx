import React from 'react';
import BankLogoBadge from './BankLogoBadge';
import { type Language, useLanguage } from '../context/LanguageContext';
import { getCuratedBanks, type CuratedBankCountryCode } from '../data/curatedBanks';

const marketOrder: CuratedBankCountryCode[] = ['DE', 'PL', 'ES', 'GB'];

const flagByMarket: Record<CuratedBankCountryCode, string> = {
  DE: 'https://flagcdn.com/w80/de.png',
  PL: 'https://flagcdn.com/w80/pl.png',
  ES: 'https://flagcdn.com/w80/es.png',
  GB: 'https://flagcdn.com/w80/gb.png',
};

const marketLabels: Record<Language, Record<CuratedBankCountryCode, string>> = {
  en: {
    DE: 'Germany',
    PL: 'Poland',
    ES: 'Spain',
    GB: 'United Kingdom',
  },
  de: {
    DE: 'Deutschland',
    PL: 'Polen',
    ES: 'Spanien',
    GB: 'Vereinigtes Königreich',
  },
  pl: {
    DE: 'Niemcy',
    PL: 'Polska',
    ES: 'Hiszpania',
    GB: 'Wielka Brytania',
  },
};

const SupportedBanks: React.FC = () => {
  const { language, messages } = useLanguage();
  const { leakPage } = messages;

  return (
    <section className="px-6 sm:px-10 pb-8 sm:pb-10">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-primary/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(239,248,243,0.88))] p-5 sm:p-6 md:p-8 shadow-[0_25px_80px_-45px_rgba(0,0,0,0.3)]">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <span className="text-[10px] uppercase tracking-[0.35em] font-bold text-primary/60">
            {leakPage.supportedBanksEyebrow}
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-tight text-charcoal">
            {leakPage.supportedBanksTitle}
          </h2>
          <p className="text-sm sm:text-base text-charcoal/60 leading-relaxed">
            {leakPage.supportedBanksDescription}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {marketOrder.map((countryCode, index) => {
            const banks = getCuratedBanks(countryCode);
            const animatedBanks = [...banks, ...banks];

            return (
              <article
                key={countryCode}
                className="relative overflow-hidden rounded-[1.8rem] border border-primary/10 bg-[radial-gradient(circle_at_top_left,rgba(29,201,106,0.12),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.95),rgba(248,251,249,0.9))] p-4 sm:p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={flagByMarket[countryCode]}
                      alt={`${countryCode} flag`}
                      className="h-6 w-9 rounded-md object-cover shadow-sm"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold uppercase tracking-[0.18em] text-charcoal/70">
                        {marketLabels[language][countryCode]}
                      </p>
                      <p className="text-[11px] text-charcoal/45">{countryCode}</p>
                    </div>
                  </div>
                </div>

                <div className="bank-marquee-shell mt-4">
                  <div
                    className={`bank-marquee-track ${
                      index % 2 === 1 ? 'bank-marquee-track-reverse' : ''
                    }`}
                  >
                    {animatedBanks.map((bank, itemIndex) => (
                      <div
                        key={`${countryCode}-${bank.id}-${itemIndex}`}
                        className="bank-marquee-item"
                      >
                        <BankLogoBadge
                          name={bank.name}
                          logoUrl={bank.logoUrl}
                          className="h-11 w-11 min-w-[2.75rem] rounded-2xl"
                          imageClassName="p-2"
                          fallbackClassName="text-base"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-charcoal">
                            {bank.name}
                          </p>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-charcoal/40">
                            {countryCode}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SupportedBanks;
