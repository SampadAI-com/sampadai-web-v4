import React, { useEffect, useMemo, useState } from 'react';
import { type Language, useLanguage } from '../context/LanguageContext';

type CountryCode = 'DE' | 'PL' | 'US' | 'ES' | 'GB';

type BankOption = {
  id: string;
  name: string;
};

type BankSource = 'idle' | 'fallback' | 'api';
type LeakStatus = 'idle' | 'loading' | 'ready' | 'pending';
type BankEntry = {
  id: string;
  bankId: string;
  amount: string;
};

const countryOptions: Record<Language, { code: CountryCode; label: string }[]> = {
  en: [
    { code: 'DE', label: 'Germany' },
    { code: 'PL', label: 'Poland' },
    { code: 'US', label: 'United States' },
    { code: 'ES', label: 'Spain' },
    { code: 'GB', label: 'United Kingdom' },
  ],
  de: [
    { code: 'DE', label: 'Deutschland' },
    { code: 'PL', label: 'Polen' },
    { code: 'US', label: 'Vereinigte Staaten' },
    { code: 'ES', label: 'Spanien' },
    { code: 'GB', label: 'Vereinigtes Königreich' },
  ],
  pl: [
    { code: 'DE', label: 'Niemcy' },
    { code: 'PL', label: 'Polska' },
    { code: 'US', label: 'Stany Zjednoczone' },
    { code: 'ES', label: 'Hiszpania' },
    { code: 'GB', label: 'Wielka Brytania' },
  ],
};

const fallbackBanksByCountry: Record<CountryCode, BankOption[]> = {
  DE: [
    { id: 'deutsche-bank', name: 'Deutsche Bank' },
    { id: 'commerzbank', name: 'Commerzbank' },
    { id: 'sparkasse', name: 'Sparkasse' },
    { id: 'n26', name: 'N26' },
  ],
  PL: [
    { id: 'pko-bp', name: 'PKO Bank Polski' },
    { id: 'mbank', name: 'mBank' },
    { id: 'santander-pl', name: 'Santander Bank Polska' },
    { id: 'ing-pl', name: 'ING Bank Slaski' },
  ],
  US: [
    { id: 'chase', name: 'Chase' },
    { id: 'bofa', name: 'Bank of America' },
    { id: 'wells-fargo', name: 'Wells Fargo' },
    { id: 'citi', name: 'Citi' },
  ],
  ES: [
    { id: 'santander-es', name: 'Banco Santander' },
    { id: 'bbva', name: 'BBVA' },
    { id: 'caixabank', name: 'CaixaBank' },
    { id: 'sabadell', name: 'Banco Sabadell' },
  ],
  GB: [
    { id: 'barclays', name: 'Barclays' },
    { id: 'hsbc', name: 'HSBC' },
    { id: 'lloyds', name: 'Lloyds Bank' },
    { id: 'natwest', name: 'NatWest' },
  ],
};

const currencyByCountry: Record<CountryCode, { symbol: string; code: string }> = {
  DE: { symbol: '€', code: 'EUR' },
  ES: { symbol: '€', code: 'EUR' },
  PL: { symbol: 'zł', code: 'PLN' },
  US: { symbol: '$', code: 'USD' },
  GB: { symbol: '£', code: 'GBP' },
};

const leakUiMessages: Record<
  Language,
  { loading: string; genericError: string; invalidAmount: string; missingFields: string }
> = {
  en: {
    loading: 'Calculating...',
    genericError: 'Unable to load leak right now.',
    invalidAmount: 'Enter a valid amount.',
    missingFields: 'Select a country and add banks with amounts to continue.',
  },
  de: {
    loading: 'Wird berechnet...',
    genericError: 'Das Leak kann gerade nicht geladen werden.',
    invalidAmount: 'Bitte gib einen gültigen Betrag ein.',
    missingFields: 'Bitte wähle ein Land und füge Banken mit Beträgen hinzu.',
  },
  pl: {
    loading: 'Obliczamy...',
    genericError: 'Nie udało się teraz wczytać wycieku.',
    invalidAmount: 'Wpisz poprawną kwotę.',
    missingFields: 'Wybierz kraj i dodaj banki z kwotami.',
  },
};

const normalizeBanks = (payload: unknown): BankOption[] => {
  if (!payload) {
    return [];
  }

  const data = (payload as { banks?: unknown }).banks ?? payload;
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((bank) => {
      if (typeof bank === 'string') {
        const trimmed = bank.trim();
        if (!trimmed) {
          return null;
        }
        return {
          id: trimmed.toLowerCase().replace(/\s+/g, '-'),
          name: trimmed,
        };
      }

      if (typeof bank === 'object' && bank) {
        const candidate = bank as { id?: unknown; name?: unknown };
        const name = typeof candidate.name === 'string' ? candidate.name.trim() : '';
        if (!name) {
          return null;
        }
        const id =
          typeof candidate.id === 'string' && candidate.id.trim().length > 0
            ? candidate.id.trim()
            : name.toLowerCase().replace(/\s+/g, '-');
        return { id, name };
      }

      return null;
    })
    .filter((bank): bank is BankOption => Boolean(bank));
};

const parseAmount = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  let sanitized = trimmed.replace(/\s/g, '');
  const hasDot = sanitized.includes('.');
  const hasComma = sanitized.includes(',');
  if (hasDot && hasComma) {
    sanitized = sanitized.replace(/,/g, '');
  } else if (hasComma && !hasDot) {
    sanitized = sanitized.replace(/,/g, '.');
  }
  sanitized = sanitized.replace(/[^0-9.]/g, '');

  const parsed = Number.parseFloat(sanitized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const formatCurrencyValue = (value: number, currencyCode: string, language: Language): string => {
  try {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currencyCode}`;
  }
};

const extractLeakValue = (payload: unknown, currencyCode: string | null, language: Language): string => {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const data = payload as Record<string, unknown>;
  const candidate = data.leak ?? data.value ?? data.amount ?? data.estimate;
  if (typeof candidate === 'number') {
    return currencyCode ? formatCurrencyValue(candidate, currencyCode, language) : candidate.toFixed(2);
  }

  if (typeof candidate === 'string') {
    return candidate;
  }

  return '';
};

const parseLeakScore = (payload: unknown, leakValue: string): number | null => {
  if (payload && typeof payload === 'object') {
    const data = payload as Record<string, unknown>;
    const candidate = data.score ?? data.leakScore ?? data.rating;
    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      return Math.max(0, Math.min(100, Math.round(candidate)));
    }
  }

  const sanitized = leakValue.replace(/[^0-9.,]/g, '');
  if (!sanitized) {
    return null;
  }
  const hasDot = sanitized.includes('.');
  const hasComma = sanitized.includes(',');
  let normalized = sanitized;
  if (hasDot && hasComma) {
    normalized = normalized.replace(/,/g, '');
  } else if (hasComma && !hasDot) {
    normalized = normalized.replace(/,/g, '.');
  }
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  if (parsed >= 0 && parsed <= 100) {
    return Math.round(parsed);
  }

  return null;
};

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3 ? normalized.split('').map((ch) => ch + ch).join('') : normalized;
  const int = Number.parseInt(full, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${toHex(clamp(Math.round(r), 0, 255))}${toHex(clamp(Math.round(g), 0, 255))}${toHex(
    clamp(Math.round(b), 0, 255)
  )}`;
};

const mixColors = (from: string, to: string, t: number): string => {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  const ratio = clamp(t, 0, 1);
  return rgbToHex(
    start.r + (end.r - start.r) * ratio,
    start.g + (end.g - start.g) * ratio,
    start.b + (end.b - start.b) * ratio
  );
};

const getThemeColorForScore = (score: number): string => {
  const normalized = clamp(score, 0, 100) / 100;
  const coralDeep = mixColors('#f2a68d', '#2d3436', 0.25);
  const stops: { t: number; color: string }[] = [
    { t: 0, color: '#9db4a9' },
    { t: 0.4, color: '#1dc96a' },
    { t: 0.7, color: '#f2a68d' },
    { t: 1, color: coralDeep },
  ];

  for (let i = 0; i < stops.length - 1; i += 1) {
    const current = stops[i];
    const next = stops[i + 1];
    if (normalized >= current.t && normalized <= next.t) {
      const localT = (normalized - current.t) / (next.t - current.t);
      return mixColors(current.color, next.color, localT);
    }
  }

  return stops[stops.length - 1].color;
};

const StickyFooter: React.FC = () => {
  const { language, messages } = useLanguage();
  const { stickyFooter } = messages;
  const localizedUi = leakUiMessages[language];
  const countries = countryOptions[language];

  const [country, setCountry] = useState<CountryCode | ''>('');
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [bankSource, setBankSource] = useState<BankSource>('idle');
  const [isFetchingBanks, setIsFetchingBanks] = useState(false);
  const [bankEntries, setBankEntries] = useState<BankEntry[]>([
    { id: 'bank-entry-1', bankId: '', amount: '' },
  ]);

  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leakStatus, setLeakStatus] = useState<LeakStatus>('idle');
  const [leakValue, setLeakValue] = useState('');
  const [leakNote, setLeakNote] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [leakScore, setLeakScore] = useState<number | null>(null);
  const confettiPieces = useMemo(() => {
    if (!showOverlay) {
      return [];
    }

    const baseColor = getThemeColorForScore(leakScore ?? 0);
    const lightColor = mixColors(baseColor, '#ffffff', 0.35);
    const darkColor = mixColors(baseColor, '#2d3436', 0.35);
    const colors = [lightColor, baseColor, darkColor, mixColors(baseColor, '#1dc96a', 0.4), '#ffffff'];
    return Array.from({ length: 36 }, (_, index) => ({
      id: `confetti-${index}`,
      left: Math.random() * 100,
      size: 6 + Math.random() * 8,
      delay: Math.random() * 0.8,
      duration: 2.8 + Math.random() * 2.4,
      color: colors[index % colors.length],
      opacity: 0.7 + Math.random() * 0.3,
    }));
  }, [showOverlay, leakScore]);

  const currency = useMemo(() => (country ? currencyByCountry[country] : null), [country]);

  useEffect(() => {
    if (!country) {
      setBanks([]);
      setBankSource('idle');
      setIsFetchingBanks(false);
      setBankEntries([{ id: 'bank-entry-1', bankId: '', amount: '' }]);
      setLeakStatus('idle');
      setLeakValue('');
      setLeakNote('');
      return;
    }

    let cancelled = false;
    const fallback = fallbackBanksByCountry[country] ?? [];

    setBanks(fallback);
    setBankSource('fallback');
    setIsFetchingBanks(true);
    setBankEntries([{ id: `bank-entry-${Date.now()}`, bankId: '', amount: '' }]);
    setLeakStatus('idle');
    setLeakValue('');
    setLeakNote('');

    const loadBanks = async () => {
      try {
        const response = await fetch(`/api/banks?country=${country}`);
        if (!response.ok) {
          throw new Error('Bank fetch failed');
        }

        const payload: unknown = await response.json();
        const normalized = normalizeBanks(payload);
        if (!cancelled && normalized.length > 0) {
          setBanks(normalized);
          setBankSource('api');
        }
      } catch {
        if (!cancelled) {
          setBankSource('fallback');
        }
      } finally {
        if (!cancelled) {
          setIsFetchingBanks(false);
        }
      }
    };

    loadBanks();

    return () => {
      cancelled = true;
    };
  }, [country]);

  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCountry(event.target.value as CountryCode);
    setFeedbackStatus('idle');
    setFeedbackMessage('');
  };

  const updateBankEntry = (entryId: string, next: Partial<BankEntry>) => {
    setBankEntries((prev) =>
      prev.map((entry) => (entry.id === entryId ? { ...entry, ...next } : entry))
    );
    setFeedbackStatus('idle');
    setFeedbackMessage('');
    setLeakStatus('idle');
    setLeakValue('');
    setLeakNote('');
  };

  const addBankEntry = () => {
    setBankEntries((prev) => [
      ...prev,
      { id: `bank-entry-${Date.now()}-${prev.length}`, bankId: '', amount: '' },
    ]);
  };

  const removeBankEntry = (entryId: string) => {
    setBankEntries((prev) => {
      if (prev.length === 1) {
        return prev;
      }
      return prev.filter((entry) => entry.id !== entryId);
    });
    setFeedbackStatus('idle');
    setFeedbackMessage('');
    setLeakStatus('idle');
    setLeakValue('');
    setLeakNote('');
  };

  const submitLeak = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isExpanded) {
      setIsExpanded(true);
      return;
    }

    if (!country || bankEntries.length === 0) {
      setFeedbackStatus('error');
      setFeedbackMessage(localizedUi.missingFields);
      return;
    }

    const parsedEntries = bankEntries.map((entry) => ({
      ...entry,
      parsedAmount: parseAmount(entry.amount),
    }));

    const hasMissingFields = parsedEntries.some(
      (entry) => !entry.bankId || !entry.amount.trim()
    );
    if (hasMissingFields) {
      setFeedbackStatus('error');
      setFeedbackMessage(localizedUi.missingFields);
      return;
    }

    const hasInvalidAmount = parsedEntries.some((entry) => entry.parsedAmount === null);
    if (hasInvalidAmount) {
      setFeedbackStatus('error');
      setFeedbackMessage(localizedUi.invalidAmount);
      return;
    }

    setIsSubmitting(true);
    setFeedbackStatus('idle');
    setFeedbackMessage('');
    setLeakStatus('loading');
    setLeakValue('');
    setLeakNote('');
    setLeakScore(80);
    setShowOverlay(true);

    const setSoftFallback = () => {
      setLeakStatus('pending');
      setLeakValue('');
      setLeakNote(stickyFooter.leakFallback);
    };

    try {
      const response = await fetch('/api/leak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          country,
          banks: parsedEntries.map((entry) => ({
            bankId: entry.bankId,
            amount: entry.parsedAmount as number,
          })),
        }),
      });

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        setSoftFallback();
        return;
      }

      const value = extractLeakValue(payload, currency?.code ?? null, language);
      if (!value) {
        setSoftFallback();
        return;
      }

      const payloadObject =
        payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
      const note =
        payloadObject && typeof payloadObject.note === 'string'
          ? payloadObject.note
          : stickyFooter.leakDescription;

      setLeakStatus('ready');
      setLeakValue(value);
      setLeakNote(note);
      const score = parseLeakScore(payload, value) ?? 80;
      setLeakScore(score);
    } catch {
      setSoftFallback();
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepBase =
    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] font-bold';
  const stepActive = 'border-primary/30 bg-primary/10 text-primary';
  const stepInactive = 'border-primary/10 bg-white/60 text-primary/50';
  const labelClass = 'text-[11px] uppercase tracking-[0.2em] text-primary/60 font-bold';
  const controlClass =
    'w-full bg-white/90 border border-primary/10 rounded-2xl text-sm px-4 sm:px-5 py-3 sm:py-3.5 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 font-semibold transition-all min-w-0';

  const expandPanelClass = isExpanded
    ? 'max-h-[720px] opacity-100 translate-y-0'
    : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none';
  const hasAnyBank = bankEntries.some((entry) => entry.bankId);
  const hasAnyAmount = bankEntries.some((entry) => entry.amount.trim());
  const leakMessage =
    leakScore === null
      ? ''
      : leakScore >= 100
        ? stickyFooter.leakOverlayCritical
        : leakScore >= 75
          ? stickyFooter.leakOverlayVeryHigh
          : leakScore >= 50
            ? stickyFooter.leakOverlayHigh
          : leakScore >= 25
              ? stickyFooter.leakOverlayModerate
              : stickyFooter.leakOverlayLow;
  const scoreValue = leakScore ?? 0;
  const overlayBaseColor = getThemeColorForScore(scoreValue);
  const overlayLight = mixColors(overlayBaseColor, '#ffffff', 0.35);
  const overlayDark = mixColors(overlayBaseColor, '#2d3436', 0.35);
  const overlayGlowStyle = {
    backgroundImage: `radial-gradient(circle at 20% 20%, ${overlayLight} 0%, rgba(0,0,0,0) 55%),\nradial-gradient(circle at 80% 30%, ${overlayBaseColor} 0%, rgba(0,0,0,0) 55%),\nradial-gradient(circle at 40% 80%, ${overlayDark} 0%, rgba(0,0,0,0) 60%)`,
    opacity: 0.6,
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 md:p-8 pointer-events-none">
      <div className="max-w-5xl mx-auto bg-white/90 luxury-blur rounded-[2rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] border border-primary/10 p-4 md:p-6 flex flex-col items-center gap-4 pointer-events-auto">
        <div className="w-full flex flex-col items-center gap-2 px-2 sm:px-6 text-center">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-primary font-black block mb-1">
              {stickyFooter.membershipLabel}
            </span>
            <span className="text-sm font-bold opacity-80 whitespace-nowrap">
              {stickyFooter.membershipValue}
            </span>
          </div>

          <div className="h-px w-16 bg-primary/10"></div>

          <p className="max-w-2xl text-sm md:text-base font-medium opacity-70 italic leading-tight">
            {stickyFooter.quote}
          </p>
        </div>

        <form onSubmit={submitLeak} className="w-full max-w-4xl">
          <div
            className={`overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-out ${expandPanelClass}`}
          >
            <div className="hidden sm:flex flex-wrap items-center justify-center gap-2 mb-3">
              <span className={`${stepBase} ${country ? stepActive : stepInactive}`}>
                1 {stickyFooter.countryLabel}
              </span>
              <span className={`${stepBase} ${hasAnyBank ? stepActive : stepInactive}`}>
                2 {stickyFooter.bankLabel}
              </span>
              <span className={`${stepBase} ${hasAnyAmount ? stepActive : stepInactive}`}>
                3 {stickyFooter.amountLabel}
              </span>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-3 items-start">
              <label className="flex flex-col gap-2">
                <span className={labelClass}>{stickyFooter.countryLabel}</span>
                <select
                  className={controlClass}
                  value={country}
                  onChange={handleCountryChange}
                  disabled={isSubmitting}
                >
                  <option value="">{stickyFooter.countryPlaceholder}</option>
                  {countries.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <div className="min-h-[14px] text-[11px] font-semibold text-primary/50">
                  {'\u00A0'}
                </div>
              </label>

              <div className="flex flex-col gap-3 sm:col-span-1 xl:col-span-2">
                {bankEntries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="grid gap-3 sm:grid-cols-[minmax(190px,1.1fr)_minmax(160px,1fr)_auto] items-start"
                  >
                    <label className="flex flex-col gap-2">
                      <span className={`${labelClass} ${index === 0 ? '' : 'sr-only'}`}>
                        {stickyFooter.bankLabel}
                      </span>
                      <select
                        className={controlClass}
                        value={entry.bankId}
                        onChange={(event) => updateBankEntry(entry.id, { bankId: event.target.value })}
                        disabled={!country || isSubmitting}
                      >
                        <option value="">{stickyFooter.bankPlaceholder}</option>
                        {banks.map((bank) => {
                          const isSelectedElsewhere = bankEntries.some(
                            (other) => other.id !== entry.id && other.bankId === bank.id
                          );
                          return (
                            <option key={bank.id} value={bank.id} disabled={isSelectedElsewhere}>
                              {bank.name}
                            </option>
                          );
                        })}
                      </select>
                    </label>

                    <label className="flex flex-col gap-2">
                      <span className={`${labelClass} ${index === 0 ? '' : 'sr-only'}`}>
                        {stickyFooter.amountLabel}
                      </span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary/60">
                          {currency ? currency.symbol : '€'}
                        </span>
                        <input
                          className={`${controlClass} pr-14 amount-input`}
                          placeholder={stickyFooter.amountPlaceholder}
                          type="text"
                          inputMode="decimal"
                          value={entry.amount}
                          onChange={(event) => updateBankEntry(entry.id, { amount: event.target.value })}
                          disabled={!entry.bankId || isSubmitting}
                        />
                        {currency ? (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-primary/60">
                            {currency.code}
                          </span>
                        ) : null}
                      </div>
                    </label>

                    <div className="flex flex-col gap-2">
                      <span
                        className={`${labelClass} text-transparent ${index === 0 ? '' : 'sr-only'}`}
                        aria-hidden="true"
                      >
                        {'\u00A0'}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeBankEntry(entry.id)}
                        disabled={bankEntries.length === 1}
                        className="h-[46px] rounded-2xl border border-primary/20 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary/70 transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {stickyFooter.removeBankButton}
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex flex-wrap items-center gap-2 min-h-[14px] text-[11px] font-semibold text-primary/50">
                  <span className={isFetchingBanks ? '' : 'text-transparent'}>
                    {isFetchingBanks ? stickyFooter.bankLoading : '\u00A0'}
                  </span>
                  <span className={bankSource === 'fallback' ? '' : 'text-transparent'}>
                    {bankSource === 'fallback' ? stickyFooter.bankFallback : '\u00A0'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={addBankEntry}
                  className="self-start rounded-full border border-primary/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary/70 transition hover:border-primary/50 hover:text-primary"
                >
                  {stickyFooter.addBankButton}
                </button>
              </div>
            </div>

            <div className="mt-3 flex w-full flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
              <span className="text-primary/60 text-left">{stickyFooter.amountHelper}</span>
              <span
                aria-live="polite"
                className={`font-semibold text-left sm:text-right ${
                  feedbackStatus === 'error' ? 'text-red-500' : 'text-primary/70'
                } ${feedbackMessage ? '' : 'text-transparent'} sm:ml-auto`}
              >
                {feedbackMessage || '\u00A0'}
              </span>
            </div>

            {leakStatus !== 'idle' ? (
              <div className="mt-3 rounded-2xl border border-primary/10 bg-white/70 p-4 backdrop-blur text-center sm:text-left">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-bold">
                      {stickyFooter.leakTitle}
                    </p>
                    <p className="text-sm font-medium text-primary/80">
                      {leakStatus === 'loading'
                        ? localizedUi.loading
                        : leakNote || stickyFooter.leakDescription}
                    </p>
                  </div>
                  {leakStatus === 'ready' && leakValue ? (
                    <div className="text-center sm:text-right">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-primary/70 font-bold block">
                        {stickyFooter.leakResultLabel}
                      </span>
                      <span className="text-lg font-black text-primary block">{leakValue}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-3 flex flex-col items-center gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full max-w-sm bg-primary hover:bg-primary/90 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl text-sm font-bold tracking-tight transition-all active:scale-95 shadow-xl shadow-primary/20 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-80"
            >
              {isSubmitting ? localizedUi.loading : stickyFooter.leakButton}
            </button>
            {isExpanded ? (
              <button
                type="button"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/60 hover:text-primary transition"
                onClick={() => setIsExpanded(false)}
              >
                {stickyFooter.collapseButton}
              </button>
            ) : null}
          </div>
        </form>
      </div>
      {showOverlay ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6 pointer-events-auto">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowOverlay(false)}
          />
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {confettiPieces.map((piece) => (
              <span
                key={piece.id}
                className="confetti-piece"
                style={{
                  left: `${piece.left}%`,
                  width: `${piece.size}px`,
                  height: `${piece.size * 0.6}px`,
                  animationDelay: `${piece.delay}s`,
                  animationDuration: `${piece.duration}s`,
                  backgroundColor: piece.color,
                  opacity: piece.opacity,
                }}
              />
            ))}
          </div>
          <div className="relative w-full max-w-3xl overflow-hidden rounded-[2.5rem] border border-white/20 bg-black/60 p-8 text-center text-white shadow-2xl">
            <div className="absolute inset-0" style={overlayGlowStyle} />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <p className="text-[10px] uppercase tracking-[0.4em] text-white/70 font-semibold">
                {stickyFooter.leakOverlayTitle}
              </p>
              <div className="text-6xl sm:text-7xl font-black tracking-tight">
                {leakScore !== null ? leakScore : '—'}
              </div>
              {leakMessage ? (
                <p className="max-w-xl text-sm sm:text-base text-white/80">{leakMessage}</p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </footer>
  );
};

export default StickyFooter;
