import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type Language = 'en' | 'de' | 'pl';

type NudgeCardTranslation = {
  title: string;
  description: string;
  statOneLabel: string;
  statOneValue: string;
  statOneSub: string;
  statTwoLabel: string;
  statTwoValue: string;
  statTwoSub: string;
};

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
  philosophy: {
    line1PartBeforeHighlight: string;
    line1Highlight: string;
    line1PartBetween: string;
    line1Emphasis: string;
    line1PartAfterEmphasis: string;
    line2: string;
  };
  nudges: {
    badgePrefix: string;
    firstCard: NudgeCardTranslation;
    secondCard: NudgeCardTranslation;
  };
  visualCalm: {
    imageAlt: string;
    headingLine1: string;
    headingLine2: string;
    description: string;
  };
  finalCta: {
    headingLine1: string;
    headingLine2: string;
    descriptionLine1: string;
    descriptionLine2: string;
  };
  stickyFooter: {
    membershipLabel: string;
    membershipValue: string;
    quote: string;
    emailPlaceholder: string;
    waitlistButton: string;
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
    philosophy: {
      line1PartBeforeHighlight: 'Most financial apps focus on ',
      line1Highlight: 'transactions',
      line1PartBetween: '. We focus on how those transactions affect your ',
      line1Emphasis: 'well-being',
      line1PartAfterEmphasis: '.',
      line2:
        'Money isn\'t just numbers. It\'s the breath you take when you know you\'re covered. It\'s the freedom to say "no" to things that drain you.',
    },
    nudges: {
      badgePrefix: 'The Nudge',
      firstCard: {
        title: 'The Silent Leak',
        description:
          'Keeping money under the mattress feels safe. But is it? Inflation acts like a slow leak in a beautiful vase, quietly eroding your future peace.',
        statOneLabel: 'Sitting Still',
        statOneValue: '-4.2%',
        statOneSub: 'Yearly Value Loss',
        statTwoLabel: 'Sampadai Flow',
        statTwoValue: '+6.8%',
        statTwoSub: 'Avg. Wellness Yield',
      },
      secondCard: {
        title: 'The Sleep Easy Fund',
        description:
          'A safety net isn\'t just for emergencies. It\'s the psychological floor that allows you to reach for the ceiling and dream bigger.',
        statOneLabel: 'Financial Stress',
        statOneValue: '72%',
        statOneSub: 'Women feel anxious',
        statTwoLabel: 'Safety Net Effect',
        statTwoValue: '-45%',
        statTwoSub: 'Lower Daily Cortisol',
      },
    },
    visualCalm: {
      imageAlt: 'Peaceful financial wellness',
      headingLine1: 'Financial health is',
      headingLine2: 'mental health.',
      description:
        'We provide the tools to nurture your wealth like a garden: patiently, intentionally, and with care.',
    },
    finalCta: {
      headingLine1: 'Ready to change your',
      headingLine2: 'relationship with money?',
      descriptionLine1: 'Join 15,000+ women who are redefining what it means',
      descriptionLine2: 'to be financially secure.',
    },
    stickyFooter: {
      membershipLabel: 'Current Membership',
      membershipValue: 'Limited Invitations Remaining',
      quote: '"The Headspace for your financial life."',
      emailPlaceholder: 'Email address',
      waitlistButton: 'Join the Waitlist',
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
    philosophy: {
      line1PartBeforeHighlight: 'Die meisten Finanz-Apps konzentrieren sich auf ',
      line1Highlight: 'Transaktionen',
      line1PartBetween: '. Wir konzentrieren uns darauf, wie sich diese Transaktionen auf dein ',
      line1Emphasis: 'Wohlbefinden',
      line1PartAfterEmphasis: ' auswirken.',
      line2:
        'Geld ist mehr als nur Zahlen. Es ist der Atemzug, den du nimmst, wenn du weißt, dass du abgesichert bist. Es ist die Freiheit, zu Dingen "nein" zu sagen, die dir Energie rauben.',
    },
    nudges: {
      badgePrefix: 'Der Impuls',
      firstCard: {
        title: 'Das stille Leck',
        description:
          'Geld unter der Matratze aufzubewahren fühlt sich sicher an. Aber ist es das wirklich? Inflation wirkt wie ein langsames Leck in einer schönen Vase und untergräbt leise deinen zukünftigen inneren Frieden.',
        statOneLabel: 'Untätig liegen',
        statOneValue: '-4.2%',
        statOneSub: 'Jährlicher Wertverlust',
        statTwoLabel: 'Sampadai Flow',
        statTwoValue: '+6.8%',
        statTwoSub: 'Durchschn. Wohlfühlrendite',
      },
      secondCard: {
        title: 'Der Ruhig-schlafen-Fonds',
        description:
          'Ein Sicherheitsnetz ist nicht nur für Notfälle da. Es ist der psychologische Boden, der es dir erlaubt, nach der Decke zu greifen und größer zu träumen.',
        statOneLabel: 'Finanzieller Stress',
        statOneValue: '72%',
        statOneSub: 'Frauen fühlen sich ängstlich',
        statTwoLabel: 'Effekt des Sicherheitsnetzes',
        statTwoValue: '-45%',
        statTwoSub: 'Weniger tägliches Cortisol',
      },
    },
    visualCalm: {
      imageAlt: 'Ruhiges finanzielles Wohlbefinden',
      headingLine1: 'Finanzielle Gesundheit ist',
      headingLine2: 'mentale Gesundheit.',
      description:
        'Wir geben dir Werkzeuge an die Hand, mit denen du dein Vermögen wie einen Garten pflegen kannst: geduldig, bewusst und mit Sorgfalt.',
    },
    finalCta: {
      headingLine1: 'Bereit, deine',
      headingLine2: 'Beziehung zu Geld zu verändern?',
      descriptionLine1: 'Schließe dich über 15.000 Frauen an, die neu definieren, was es bedeutet',
      descriptionLine2: 'finanziell abgesichert zu sein.',
    },
    stickyFooter: {
      membershipLabel: 'Aktuelle Mitgliedschaft',
      membershipValue: 'Nur noch begrenzte Einladungen',
      quote: '"Der mentale Freiraum für dein Finanzleben."',
      emailPlaceholder: 'E-Mail-Adresse',
      waitlistButton: 'Zur Warteliste',
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
    philosophy: {
      line1PartBeforeHighlight: 'Większość aplikacji finansowych skupia się na ',
      line1Highlight: 'transakcjach',
      line1PartBetween: '. My skupiamy się na tym, jak te transakcje wpływają na Twój ',
      line1Emphasis: 'dobrostan',
      line1PartAfterEmphasis: '.',
      line2:
        'Pieniądze to nie tylko liczby. To oddech, który bierzesz, gdy wiesz, że jesteś zabezpieczona. To wolność, by mówić "nie" rzeczom, które Cię wyczerpują.',
    },
    nudges: {
      badgePrefix: 'Impuls',
      firstCard: {
        title: 'Cichy wyciek',
        description:
          'Trzymanie pieniędzy pod materacem wydaje się bezpieczne. Ale czy na pewno? Inflacja działa jak powolny wyciek z pięknego wazonu, po cichu osłabiając Twój przyszły spokój.',
        statOneLabel: 'Bez ruchu',
        statOneValue: '-4.2%',
        statOneSub: 'Roczna utrata wartości',
        statTwoLabel: 'Sampadai Flow',
        statTwoValue: '+6.8%',
        statTwoSub: 'Śr. zysk dobrostanu',
      },
      secondCard: {
        title: 'Fundusz Spokojnego Snu',
        description:
          'Poduszka bezpieczeństwa to nie tylko rozwiązanie na nagłe sytuacje. To psychologiczna podłoga, która pozwala sięgać po sufit i marzyć odważniej.',
        statOneLabel: 'Stres finansowy',
        statOneValue: '72%',
        statOneSub: 'Kobiety czują lęk',
        statTwoLabel: 'Efekt poduszki bezpieczeństwa',
        statTwoValue: '-45%',
        statTwoSub: 'Niższy dzienny kortyzol',
      },
    },
    visualCalm: {
      imageAlt: 'Spokojny dobrostan finansowy',
      headingLine1: 'Zdrowie finansowe to',
      headingLine2: 'zdrowie psychiczne.',
      description:
        'Dajemy narzędzia, które pomagają pielęgnować majątek jak ogród: cierpliwie, świadomie i z troską.',
    },
    finalCta: {
      headingLine1: 'Gotowa zmienić swoją',
      headingLine2: 'relację z pieniędzmi?',
      descriptionLine1: 'Dołącz do ponad 15 000 kobiet, które na nowo definiują, co znaczy',
      descriptionLine2: 'być finansowo bezpieczną.',
    },
    stickyFooter: {
      membershipLabel: 'Obecne członkostwo',
      membershipValue: 'Pozostała ograniczona liczba zaproszeń',
      quote: '"Przestrzeń dla Twojego życia finansowego."',
      emailPlaceholder: 'Adres e-mail',
      waitlistButton: 'Dołącz do listy oczekujących',
    },
  },
};

const isLanguage = (value: string | null): value is Language => {
  return value === 'en' || value === 'de' || value === 'pl';
};

type InitialLanguageState = {
  language: Language;
  hasStoredPreference: boolean;
};

const getInitialLanguageState = (): InitialLanguageState => {
  if (typeof window === 'undefined') {
    return {
      language: 'en',
      hasStoredPreference: false,
    };
  }

  try {
    const storedLanguage = window.localStorage.getItem(STORAGE_KEY);
    if (isLanguage(storedLanguage)) {
      return {
        language: storedLanguage,
        hasStoredPreference: true,
      };
    }

    return {
      language: 'en',
      hasStoredPreference: false,
    };
  } catch {
    return {
      language: 'en',
      hasStoredPreference: false,
    };
  }
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [initialLanguageState] = useState<InitialLanguageState>(getInitialLanguageState);
  const [language, setLanguage] = useState<Language>(initialLanguageState.language);
  const [isLanguageResolved, setIsLanguageResolved] = useState<boolean>(
    initialLanguageState.hasStoredPreference
  );
  const hasUserSelectedLanguage = useRef(false);

  const updateLanguage = (nextLanguage: Language) => {
    hasUserSelectedLanguage.current = true;
    setLanguage(nextLanguage);
    setIsLanguageResolved(true);
  };

  useEffect(() => {
    if (initialLanguageState.hasStoredPreference) {
      setIsLanguageResolved(true);
      return;
    }

    let isCancelled = false;

    const detectLanguageFromIP = async () => {
      try {
        const response = await fetch('/api/detect-language');
        if (!response.ok) {
          return;
        }

        const payload: { language?: string } = await response.json();
        if (!isCancelled && !hasUserSelectedLanguage.current && isLanguage(payload.language ?? null)) {
          setLanguage(payload.language);
        }
      } catch {
        // Keep English fallback if language detection fails.
      } finally {
        if (!isCancelled) {
          setIsLanguageResolved(true);
        }
      }
    };

    detectLanguageFromIP();

    return () => {
      isCancelled = true;
    };
  }, [initialLanguageState.hasStoredPreference]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (!isLanguageResolved) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignore storage write failures (e.g. private mode restrictions).
    }
  }, [isLanguageResolved, language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: updateLanguage,
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
