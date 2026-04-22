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
    leak: string;
  };
  hero: {
    titleLine1: string;
    titleLine2: string;
    titleEmphasis: string;
    scrollPrompt: string;
    buttonLabel: string;
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
    buttonLabel: string;
  };
  leakPage: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    supportedBanksEyebrow: string;
    supportedBanksTitle: string;
    supportedBanksDescription: string;
    backLink: string;
    reassurance: string;
    footerNote: string;
  };
  stickyFooter: {
    membershipLabel: string;
    membershipValue: string;
    quote: string;
    countryLabel: string;
    countryPlaceholder: string;
    bankLabel: string;
    bankPlaceholder: string;
    bankLoading: string;
    bankFallback: string;
    bankSupabase: string;
    bankEmpty: string;
    signalsInside: string;
    amountLabel: string;
    amountPlaceholder: string;
    amountHelper: string;
    leakButton: string;
    collapseButton: string;
    addBankButton: string;
    removeBankButton: string;
    leakOverlayTitle: string;
    leakOverlayLow: string;
    leakOverlayModerate: string;
    leakOverlayHigh: string;
    leakOverlayVeryHigh: string;
    leakOverlayCritical: string;
    leakTitle: string;
    leakDescription: string;
    leakResultLabel: string;
    leakFallback: string;
    optimal: string;
    moderateLeakStatus: string;
    criticalLeakStatus: string;
    yourRate: string;
    bestAvailable: string;
    bestProtected: string;
    projectionTitle: string;
    bestLabel: string;
    yoursLabel: string;
    nowLabel: string;
    yearsLabel: string;
    startingLabel: string;
    afterYearLabel: string;
    missedLabel: string;
    totalAfter5Years: string;
    over5Yr: string;
    insuranceWarning: string;
    waitlistPlaceholder: string;
    waitlistButton: string;
    waitlistSuccess: string;
    insuranceNoteSafe: string;
    insuranceNoteOverLimit: string;
    allocationTitle: string;
    allocationDescription: string;
    allocationCoverage: string;
    allocationBanksUsed: string;
    allocationBlend: string;
    allocationAmount: string;
    allocationInterest: string;
    allocationRate: string;
    allocationProductCap: string;
    allocationBankCap: string;
    allocationRemainderTitle: string;
    allocationRemainderNote: string;
    allocationProtectedNote: string;
    allocationHiddenBanksNote: string;
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
      leak: 'Leak Calculator',
    },
    hero: {
      titleLine1: 'Does your bank account',
      titleLine2: 'make you',
      titleEmphasis: 'feel safe?',
      scrollPrompt: 'Scroll to begin your journey',
      buttonLabel: 'Reveal your leak',
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
      buttonLabel: 'Reveal your leak',
    },
    leakPage: {
      eyebrow: 'Leak Analysis',
      titleLine1: 'Reveal the quiet leak',
      titleLine2: 'in your cash.',
      description:
        'A gentle, private estimate of how idle cash and inflation may be eroding your sense of safety.',
      supportedBanksEyebrow: 'Supported Banks',
      supportedBanksTitle: 'A focused, current mix across our live markets.',
      supportedBanksDescription:
        'We selected recognisable retail banks across Germany, Poland, Spain, and the United Kingdom so the experience stays concrete before the full directory loads.',
      backLink: 'Back to home',
      reassurance: 'Private by design. No data is stored without consent.',
      footerNote:
        'This estimate is directional only and meant to help you start a calmer, clearer money conversation.',
    },
    stickyFooter: {
      membershipLabel: 'Current Membership',
      membershipValue: 'Limited Invitations Remaining',
      quote: '"The Headspace for your financial life."',
      countryLabel: 'Country',
      countryPlaceholder: 'Select country',
      bankLabel: 'Bank',
      bankPlaceholder: 'Select bank',
      bankLoading: 'Loading banks...',
      bankFallback: 'Using curated bank set',
      bankSupabase: 'Loaded from bank directory',
      amountLabel: 'Amount held',
      amountPlaceholder: 'Enter amount',
      amountHelper: 'We use this to estimate your leak.',
      leakButton: 'Reveal your leak',
      collapseButton: 'Hide details',
      addBankButton: 'Add another bank',
      removeBankButton: 'Remove',
      leakOverlayTitle: 'Leak Score',
      leakOverlayLow: 'Low Leak',
      leakOverlayModerate: 'Moderate Leak',
      leakOverlayHigh: 'High Leak',
      leakOverlayVeryHigh: 'Very High Leak',
      leakOverlayCritical: 'Critical Leak',
      leakTitle: 'Your Leak',
      leakDescription:
        'A first look at what inflation and idle cash could be costing you each year.',
      leakResultLabel: 'Estimated annual leak',
      leakFallback: 'Leak insight will appear here once the data is connected.',
      bankEmpty: 'No banks found for this country in the database.',
      signalsInside: 'Live signals. Smarter decisions. SampadAI inside.',
      optimal: 'Optimal',
      moderateLeakStatus: 'Moderate Leak',
      criticalLeakStatus: 'Critical',
      yourRate: 'Your rate:',
      bestAvailable: 'Best available:',
      bestProtected: 'Best protected:',
      projectionTitle: '5-Year Growth Projection',
      bestLabel: 'Best',
      yoursLabel: 'Yours',
      nowLabel: 'Now',
      yearsLabel: 'Y',
      startingLabel: 'Starting',
      afterYearLabel: 'After {year} Year(s)',
      missedLabel: 'missed',
      totalAfter5Years: 'Total after 5 years at best rate:',
      over5Yr: 'over 5yr',
      insuranceWarning: 'Deposits exceeding {limit} {currency} per bank are not covered by deposit insurance.',
      waitlistPlaceholder: 'Enter your email',
      waitlistButton: 'Join Waitlist',
      waitlistSuccess: 'Added to waitlist!',
      insuranceNoteSafe: 'Your funds are within protected insurance limits.',
      insuranceNoteOverLimit: 'Money above {limit} {currency} in a single bank is not insured.',
      allocationTitle: 'Suggested protected split',
      allocationDescription:
        'We spread your cash across the highest-yielding banks we can verify, while keeping each bank within its insured limit and each visible offer within its cap.',
      allocationCoverage: 'Covered amount',
      allocationBanksUsed: 'Banks used',
      allocationBlend: 'Protected blend',
      allocationAmount: 'Suggested amount',
      allocationInterest: 'Est. yearly return',
      allocationRate: 'Rate',
      allocationProductCap: 'Offer cap',
      allocationBankCap: 'Bank cap',
      allocationRemainderTitle: 'More banks needed',
      allocationRemainderNote:
        '{amount} would still sit above the fully covered capacity visible in the current market feed.',
      allocationProtectedNote: 'This full amount can stay within covered limits using the banks below.',
      allocationHiddenBanksNote: '... and {count} more banks protecting your money',
    },
  },
  de: {
    navbar: {
      philosophy: 'Unsere Philosophie',
      nudge: 'Der Impuls',
      safety: 'Sicherheit',
      leak: 'Leak-Rechner',
    },
    hero: {
      titleLine1: 'Gibt dir dein Bankkonto',
      titleLine2: 'ein Gefühl von',
      titleEmphasis: 'Sicherheit?',
      scrollPrompt: 'Scrolle, um deine Reise zu beginnen',
      buttonLabel: 'Dein Leck anzeigen',
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
      buttonLabel: 'Dein Leck anzeigen',
    },
    leakPage: {
      eyebrow: 'Leak-Analyse',
      titleLine1: 'Finde das stille Leck',
      titleLine2: 'in deinem Guthaben.',
      description:
        'Eine sanfte, private Schätzung, wie ungenutztes Geld und Inflation dein Sicherheitsgefühl schmälern könnten.',
      supportedBanksEyebrow: 'Unterstützte Banken',
      supportedBanksTitle: 'Eine fokussierte, aktuelle Auswahl in unseren aktiven Märkten.',
      supportedBanksDescription:
        'Wir haben bekannte Retail-Banken aus Deutschland, Polen, Spanien und dem Vereinigten Königreich ausgewählt, damit das Erlebnis greifbar bleibt, bevor das vollständige Verzeichnis geladen ist.',
      backLink: 'Zurück zur Startseite',
      reassurance: 'Privat by design. Keine Daten werden ohne Zustimmung gespeichert.',
      footerNote:
        'Diese Schätzung ist nur richtungsweisend und soll dir einen ruhigeren, klareren Startpunkt geben.',
    },
    stickyFooter: {
      membershipLabel: 'Aktuelle Mitgliedschaft',
      membershipValue: 'Nur noch begrenzte Einladungen',
      quote: '"Der mentale Freiraum für dein Finanzleben."',
      countryLabel: 'Land',
      countryPlaceholder: 'Land auswählen',
      bankLabel: 'Bank',
      bankPlaceholder: 'Bank auswählen',
      bankLoading: 'Banken werden geladen...',
      bankFallback: 'Kuratiertes Bankenset aktiv',
      bankSupabase: 'Aus dem Bankenverzeichnis geladen',
      amountLabel: 'Guthaben',
      amountPlaceholder: 'Betrag eingeben',
      amountHelper: 'Wir nutzen das zur Schätzung deines Lecks.',
      leakButton: 'Dein Leck anzeigen',
      collapseButton: 'Details ausblenden',
      addBankButton: 'Weitere Bank hinzufügen',
      removeBankButton: 'Entfernen',
      leakOverlayTitle: 'Leak-Score',
      leakOverlayLow: 'Geringes Leck',
      leakOverlayModerate: 'Mittleres Leck',
      leakOverlayHigh: 'Hohes Leck',
      leakOverlayVeryHigh: 'Sehr hohes Leck',
      leakOverlayCritical: 'Kritisches Leck',
      leakTitle: 'Dein Leck',
      leakDescription:
        'Ein erster Blick darauf, was Inflation und ungenutztes Geld dich pro Jahr kosten könnten.',
      leakResultLabel: 'Geschätztes jährliches Leck',
      leakFallback: 'Sobald die Daten verbunden sind, erscheint hier dein Leak.',
      bankEmpty: 'Keine Banken für dieses Land in der Datenbank gefunden.',
      signalsInside: 'Live-Signale. Bessere Entscheidungen. SampadAI inside.',
      optimal: 'Optimal',
      moderateLeakStatus: 'Mittleres Leck',
      criticalLeakStatus: 'Kritisch',
      yourRate: 'Dein Zins:',
      bestAvailable: 'Bester verfügbarer:',
      bestProtected: 'Best geschützt:',
      projectionTitle: '5-Jahres-Wachstumsprognose',
      bestLabel: 'Bester',
      yoursLabel: 'Deiner',
      nowLabel: 'Jetzt',
      yearsLabel: 'J',
      startingLabel: 'Zu Beginn',
      afterYearLabel: 'Nach {year} Jahr(en)',
      missedLabel: 'verpasst',
      totalAfter5Years: 'Gesamt nach 5 Jahren zum besten Zinssatz:',
      over5Yr: 'über 5J',
      insuranceWarning: 'Einlagen über {limit} {currency} pro Bank sind nicht durch die Einlagensicherung gedeckt.',
      waitlistPlaceholder: 'Gib deine E-Mail ein',
      waitlistButton: 'Warteliste beitreten',
      waitlistSuccess: 'Zur Warteliste hinzugefügt!',
      insuranceNoteSafe: 'Dein Guthaben liegt innerhalb der gesetzlichen Einlagensicherung.',
      insuranceNoteOverLimit: 'Geld über {limit} {currency} bei einer einzelnen Bank ist nicht abgesichert.',
      allocationTitle: 'Empfohlene geschützte Verteilung',
      allocationDescription:
        'Wir verteilen dein Geld auf die besten verifizierten Zinsangebote, ohne die abgesicherte Grenze pro Bank oder die sichtbare Angebotsgrenze zu überschreiten.',
      allocationCoverage: 'Abgedeckter Betrag',
      allocationBanksUsed: 'Genutzte Banken',
      allocationBlend: 'Geschützter Mix',
      allocationAmount: 'Empfohlener Betrag',
      allocationInterest: 'Geschätzter Jahresertrag',
      allocationRate: 'Zins',
      allocationProductCap: 'Angebotsgrenze',
      allocationBankCap: 'Bankgrenze',
      allocationRemainderTitle: 'Mehr Banken nötig',
      allocationRemainderNote:
        '{amount} lies still above the fully covered capacity visible in the current market feed.',
      allocationProtectedNote:
        'Dieser gesamte Betrag kann mit den unten gezeigten Banken innerhalb der abgesicherten Grenzen bleiben.',
      allocationHiddenBanksNote: '... und {count} weitere Banken schützen dein Geld',
    },
  },
  pl: {
    navbar: {
      philosophy: 'Nasza filozofia',
      nudge: 'Impuls',
      safety: 'Bezpieczeństwo',
      leak: 'Kalkulator wycieku',
    },
    hero: {
      titleLine1: 'Czy Twoje konto bankowe',
      titleLine2: 'daje Ci poczucie',
      titleEmphasis: 'bezpieczeństwa?',
      scrollPrompt: 'Przewiń, aby rozpocząć swoją podróż',
      buttonLabel: 'Pokaż swój wyciek',
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
      buttonLabel: 'Pokaż swój wyciek',
    },
    leakPage: {
      eyebrow: 'Analiza wycieku',
      titleLine1: 'Odkryj cichy wyciek',
      titleLine2: 'w swoich oszczędnościach.',
      description:
        'Delikatna, prywatna estymacja tego, jak niepracująca gotówka i inflacja mogą podkopywać Twoje poczucie bezpieczeństwa.',
      supportedBanksEyebrow: 'Obsługiwane banki',
      supportedBanksTitle: 'Skupiony, aktualny zestaw dla naszych aktywnych rynków.',
      supportedBanksDescription:
        'Wybraliśmy rozpoznawalne banki detaliczne z Niemiec, Polski, Hiszpanii i Wielkiej Brytanii, aby doświadczenie było konkretne jeszcze przed załadowaniem pełnego katalogu.',
      backLink: 'Wróć na stronę główną',
      reassurance: 'Prywatność przede wszystkim. Dane nie są zapisywane bez zgody.',
      footerNote:
        'To tylko orientacyjna estymacja, która ma pomóc Ci zacząć spokojniejszą rozmowę o finansach.',
    },
    stickyFooter: {
      membershipLabel: 'Obecne członkostwo',
      membershipValue: 'Pozostała ograniczona liczba zaproszeń',
      quote: '"Przestrzeń dla Twojego życia finansowego."',
      countryLabel: 'Kraj',
      countryPlaceholder: 'Wybierz kraj',
      bankLabel: 'Bank',
      bankPlaceholder: 'Wybierz bank',
      bankLoading: 'Ładowanie banków...',
      bankFallback: 'Korzystamy z wyselekcjonowanego zestawu banków',
      bankSupabase: 'Załadowano z katalogu banków',
      amountLabel: 'Posiadana kwota',
      amountPlaceholder: 'Wpisz kwotę',
      amountHelper: 'Używamy tego do oszacowania Twojego wycieku.',
      leakButton: 'Pokaż wyciek',
      collapseButton: 'Ukryj szczegóły',
      addBankButton: 'Dodaj kolejny bank',
      removeBankButton: 'Usuń',
      leakOverlayTitle: 'Wynik wycieku',
      leakOverlayLow: 'Niski wyciek',
      leakOverlayModerate: 'Umiarkowany wyciek',
      leakOverlayHigh: 'Wysoki wyciek',
      leakOverlayVeryHigh: 'Bardzo wysoki wyciek',
      leakOverlayCritical: 'Krytyczny wyciek',
      leakTitle: 'Twój wyciek',
      leakDescription:
        'Pierwsze spojrzenie na to, ile rocznie może kosztować Cię inflacja i niepracująca gotówka.',
      leakResultLabel: 'Szacowany roczny wyciek',
      leakFallback: 'Gdy dane będą podłączone, tutaj pojawi się Twój wyciek.',
      bankEmpty: 'Nie znaleziono banków dla tego kraju w bazie danych.',
      signalsInside: 'Sygnały na żywo. Lepsze decyzje. SampadAI w środku.',
      optimal: 'Optymalnie',
      moderateLeakStatus: 'Wyciek',
      criticalLeakStatus: 'Krytyczny',
      yourRate: 'Twoje oproc.:',
      bestAvailable: 'Najlepsze dostępne:',
      bestProtected: 'Najlepsze chronione:',
      projectionTitle: 'Prognoza wzrostu na 5 lat',
      bestLabel: 'Najlepszy',
      yoursLabel: 'Twój',
      nowLabel: 'Teraz',
      yearsLabel: 'L',
      startingLabel: 'Początek',
      afterYearLabel: 'Po {year} latach/roku',
      missedLabel: 'stracone',
      totalAfter5Years: 'Suma po 5 latach przy najlepszym oprocentowaniu:',
      over5Yr: 'przez 5 lat',
      insuranceWarning: 'Depozyty przekraczające {limit} {currency} na bank nie są objęte gwarancją.',
      waitlistPlaceholder: 'Wpisz swój email',
      waitlistButton: 'Dołącz do listy',
      waitlistSuccess: 'Dodano do listy!',
      insuranceNoteSafe: 'Twoje środki mieszczą się w limitach gwarantowanych.',
      insuranceNoteOverLimit: 'Pieniądze powyżej {limit} {currency} w jednym banku nie są ubezpieczone.',
      allocationTitle: 'Sugerowany chroniony podział',
      allocationDescription:
        'Rozkładamy Twoją gotówkę między najwyżej oprocentowane banki, które możemy zweryfikować, bez przekraczania limitu ochrony na bank i widocznego limitu oferty.',
      allocationCoverage: 'Kwota objęta ochroną',
      allocationBanksUsed: 'Użyte banki',
      allocationBlend: 'Chroniona średnia',
      allocationAmount: 'Sugerowana kwota',
      allocationInterest: 'Szacowany roczny zysk',
      allocationRate: 'Oprocentowanie',
      allocationProductCap: 'Limit oferty',
      allocationBankCap: 'Limit banku',
      allocationRemainderTitle: 'Potrzeba więcej banków',
      allocationRemainderNote:
        '{amount} nadal przekracza w pełni chronioną pojemność widoczną w aktualnym feedzie rynkowym.',
      allocationProtectedNote:
        'Cała ta kwota może pozostać w granicach ochrony przy użyciu poniższych banków.',
      allocationHiddenBanksNote: '... i {count} więcej banków chroniących Twoje pieniądze',
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
