import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type Language = 'en' | 'de' | 'pl';

type TranslationContent = {
  navbar: {
    philosophy: string;
    nudge: string;
    safety: string;
  };
  hero: {
    titleLine1: string;
    titleLine2: string;
    titleEmphasis: string;
    scrollPrompt: string;
  };
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  messages: TranslationContent;
  supportedLanguages: readonly Language[];
};

const STORAGE_KEY = 'sampadai-language';
const supportedLanguages = ['en', 'de', 'pl'] as const;

const translations: Record<Language, TranslationContent> = {
  en: {
    navbar: {
      philosophy: 'Our Philosophy',
      nudge: 'The Nudge',
      safety: 'Safety',
    },
    hero: {
      titleLine1: 'Does your bank account',
      titleLine2: 'make you',
      titleEmphasis: 'feel safe?',
      scrollPrompt: 'Scroll to begin your journey',
    },
  },
  de: {
    navbar: {
      philosophy: 'Unsere Philosophie',
      nudge: 'Der Impuls',
      safety: 'Sicherheit',
    },
    hero: {
      titleLine1: 'Gibt dir dein Bankkonto',
      titleLine2: 'ein Gefühl von',
      titleEmphasis: 'Sicherheit?',
      scrollPrompt: 'Scrolle, um deine Reise zu beginnen',
    },
  },
  pl: {
    navbar: {
      philosophy: 'Nasza filozofia',
      nudge: 'Impuls',
      safety: 'Bezpieczeństwo',
    },
    hero: {
      titleLine1: 'Czy Twoje konto bankowe',
      titleLine2: 'daje Ci poczucie',
      titleEmphasis: 'bezpieczeństwa?',
      scrollPrompt: 'Przewiń, aby rozpocząć swoją podróż',
    },
  },
};

const isLanguage = (value: string | null): value is Language => {
  return value === 'en' || value === 'de' || value === 'pl';
};

const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  try {
    const storedLanguage = window.localStorage.getItem(STORAGE_KEY);
    return isLanguage(storedLanguage) ? storedLanguage : 'en';
  } catch {
    return 'en';
  }
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;

    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignore storage write failures (e.g. private mode restrictions).
    }
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      messages: translations[language],
      supportedLanguages,
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextValue => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider.');
  }

  return context;
};
