
import React from 'react';

const NudgeCard: React.FC<{
  number: string;
  title: string;
  description: string;
  accentColor: string;
  stats: { label: string; value: string; sub: string; primary?: boolean }[];
}> = ({ number, title, description, accentColor, stats }) => (
  <div className="group relative bg-white p-10 md:p-12 rounded-2xl border border-primary/5 shadow-sm hover:shadow-2xl transition-all duration-700 overflow-hidden flex flex-col justify-between">
    <div className={`absolute top-0 left-0 w-2 h-full ${accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
    
    <div className="space-y-6">
      <span className={`text-xs font-black uppercase tracking-[0.25em] ${accentColor.replace('bg-', 'text-')}`}>
        The Nudge #{number}
      </span>
      <h3 className="text-4xl font-semibold tracking-tight">{title}</h3>
      <p className="text-lg opacity-60 leading-relaxed">{description}</p>
    </div>

    <div className="pt-12 grid grid-cols-2 gap-4">
      {stats.map((stat, idx) => (
        <div 
          key={idx} 
          className={`p-6 rounded-xl transition-all duration-500 ${stat.primary ? 'bg-primary/5 border border-primary/10 group-hover:bg-primary/10' : 'bg-background-light group-hover:bg-background-light/80'}`}
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
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 py-32 bg-primary/[0.01]">
      <div className="max-w-7xl w-full grid lg:grid-cols-2 gap-10">
        <NudgeCard 
          number="01"
          title="The Silent Leak"
          accentColor="bg-coral"
          description="Keeping money under the mattress feels safe. But is it? Inflation acts like a slow leak in a beautiful vase, quietly eroding your future peace."
          stats={[
            { label: "Sitting Still", value: "-4.2%", sub: "Yearly Value Loss" },
            { label: "Sampadai Flow", value: "+6.8%", sub: "Avg. Wellness Yield", primary: true }
          ]}
        />
        
        <NudgeCard 
          number="02"
          title="The Sleep Easy Fund"
          accentColor="bg-sage"
          description="A safety net isn't just for emergencies. It's the psychological floor that allows you to reach for the ceiling and dream bigger."
          stats={[
            { label: "Financial Stress", value: "72%", sub: "Women feel anxious" },
            { label: "Safety Net Effect", value: "-45%", sub: "Lower Daily Cortisol", primary: true }
          ]}
        />
      </div>
    </section>
  );
};

export default Nudges;
