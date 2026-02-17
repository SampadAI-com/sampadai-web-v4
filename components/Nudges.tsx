
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const NudgeCard: React.FC<{
  badgePrefix: string;
  number: string;
  title: string;
  description: string;
  accentColor: string;
  stats: { label: string; value: string; sub: string; primary?: boolean }[];
}> = ({ badgePrefix, number, title, description, accentColor, stats }) => (
  <div className="group relative bg-white p-6 md:p-12 rounded-2xl border border-primary/5 shadow-sm hover:shadow-2xl transition-all duration-700 overflow-hidden flex flex-col justify-between">
    <div className={`absolute top-0 left-0 w-2 h-full ${accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
    
    <div className="space-y-6">
      <span className={`text-xs font-black uppercase tracking-[0.25em] ${accentColor.replace('bg-', 'text-')}`}>
        {badgePrefix} #{number}
      </span>
      <h3 className="text-4xl font-semibold tracking-tight">{title}</h3>
      <p className="text-lg opacity-60 leading-relaxed">{description}</p>
    </div>

    <div className="pt-8 md:pt-12 grid grid-cols-2 gap-4 max-[360px]:grid-cols-1">
      {stats.map((stat, idx) => (
        <div 
          key={idx} 
          className={`p-4 sm:p-6 rounded-xl transition-all duration-500 ${stat.primary ? 'bg-primary/5 border border-primary/10 group-hover:bg-primary/10' : 'bg-background-light group-hover:bg-background-light/80'}`}
        >
          <span className={`block text-[10px] uppercase font-bold tracking-widest mb-2 ${stat.primary ? 'text-primary/60' : 'opacity-40'}`}>
            {stat.label}
          </span>
          <span className={`text-3xl font-bold block mb-1 ${stat.primary ? 'text-primary' : stat.value.startsWith('-') ? 'text-coral' : ''}`}>
            {stat.value}
          </span>
          <span className="block text-[10px] uppercase font-bold opacity-30 tracking-wider">
            {stat.sub}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const Nudges: React.FC = () => {
  const { messages } = useLanguage();
  const { nudges } = messages;

  return (
    <section className="flex flex-col items-center justify-center bg-primary/[0.01] px-4 py-14 sm:px-6 sm:py-20 md:py-28 lg:min-h-screen">
      <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-10">
        <NudgeCard 
          badgePrefix={nudges.badgePrefix}
          number="01"
          title={nudges.firstCard.title}
          accentColor="bg-coral"
          description={nudges.firstCard.description}
          stats={[
            {
              label: nudges.firstCard.statOneLabel,
              value: nudges.firstCard.statOneValue,
              sub: nudges.firstCard.statOneSub,
            },
            {
              label: nudges.firstCard.statTwoLabel,
              value: nudges.firstCard.statTwoValue,
              sub: nudges.firstCard.statTwoSub,
              primary: true,
            }
          ]}
        />
        
        <NudgeCard 
          badgePrefix={nudges.badgePrefix}
          number="02"
          title={nudges.secondCard.title}
          accentColor="bg-sage"
          description={nudges.secondCard.description}
          stats={[
            {
              label: nudges.secondCard.statOneLabel,
              value: nudges.secondCard.statOneValue,
              sub: nudges.secondCard.statOneSub,
            },
            {
              label: nudges.secondCard.statTwoLabel,
              value: nudges.secondCard.statTwoValue,
              sub: nudges.secondCard.statTwoSub,
              primary: true,
            }
          ]}
        />
      </div>
    </section>
  );
};

export default Nudges;
