import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { type Language, useLanguage } from '../context/LanguageContext';

type CountryCode = 'DE' | 'PL' | 'US' | 'ES' | 'GB';

type BankOption = {
  id: string;
  name: string;
};

type BankSource = 'idle' | 'supabase';
type LeakStatus = 'idle' | 'loading' | 'ready' | 'pending';
type BankEntry = {
  id: string;
  bankId: string;
  amount: string;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

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


const currencyByCountry: Record<CountryCode, { symbol: string; code: string }> = {
  DE: { symbol: '€', code: 'EUR' },
  ES: { symbol: '€', code: 'EUR' },
  PL: { symbol: 'zł', code: 'PLN' },
  US: { symbol: '$', code: 'USD' },
  GB: { symbol: '£', code: 'GBP' },
};

const flagByCountry: Record<CountryCode, string> = {
  DE: 'https://flagcdn.com/w80/de.png',
  ES: 'https://flagcdn.com/w80/es.png',
  PL: 'https://flagcdn.com/w80/pl.png',
  US: 'https://flagcdn.com/w80/us.png',
  GB: 'https://flagcdn.com/w80/gb.png',
};

const bankLogoTableCandidates: Record<CountryCode, string[]> = {
  DE: ['germany_bank_logo', 'de_bank_logo', 'german_bank_logo'],
  PL: ['poland_bank_logo', 'pl_bank_logo'],
  US: ['usa_bank_logo', 'us_bank_logo', 'united_states_bank_logo', 'america_bank_logo'],
  ES: ['spain_bank_logo', 'es_bank_logo'],
  GB: ['uk_bank_logo', 'gb_bank_logo', 'united_kingdom_bank_logo', 'britain_bank_logo'],
};

const bankTableCandidates: Record<CountryCode, string[]> = {
  DE: ['germany_bank', 'de_bank', 'german_bank'],
  PL: ['poland_bank', 'pl_bank'],
  US: ['usa_bank', 'us_bank', 'united_states_bank', 'america_bank'],
  ES: ['spain_bank', 'es_bank'],
  GB: ['uk_bank', 'gb_bank', 'united_kingdom_bank', 'britain_bank'],
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
        const candidate = bank as Record<string, unknown>;
        const name =
          (typeof candidate.name === 'string' && candidate.name.trim()) ||
          (typeof candidate.bank_name === 'string' && candidate.bank_name.trim()) ||
          (typeof candidate.title === 'string' && candidate.title.trim()) ||
          '';
        if (!name) {
          return null;
        }
        const extractId = (val: unknown): string => {
          if (typeof val === 'string') return val.trim();
          if (typeof val === 'number') return String(val);
          return '';
        };

        const idCandidate = extractId(candidate.id) || extractId(candidate.bank_id) || extractId(candidate.slug);
        const id = idCandidate.length > 0 ? idCandidate : name.toLowerCase().replace(/\s+/g, '-');
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

const normalizeKey = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const readRowString = (row: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === 'number') {
      return String(value);
    }
  }
  return null;
};

const buildLogoKeyMap = (rows: Record<string, unknown>[]): Record<string, string> => {
  const map: Record<string, string> = {};
  rows.forEach((row) => {
    const id = readRowString(row, ['bank_id', 'bankId', 'id', 'slug', 'code']);
    const name = readRowString(row, ['bank_name', 'name', 'bank', 'title']);
    const logoUrl = readRowString(row, [
      'raw_public_url',
      'logo_url',
      'logo',
      'logoUrl',
      'image_url',
      'imageUrl',
      'public_url',
      'url',
      'path',
    ]);

    if (!logoUrl) {
      return;
    }

    const key = id ? normalizeKey(id) : name ? normalizeKey(name) : null;
    if (key && !map[key]) {
      map[key] = logoUrl;
    }
  });
  return map;
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

const LeakCalculator: React.FC = () => {
  const { language, messages } = useLanguage();
  const { stickyFooter } = messages;
  const localizedUi = leakUiMessages[language];
  const countries = countryOptions[language];

  const [country, setCountry] = useState<CountryCode | ''>('');
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [bankSource, setBankSource] = useState<BankSource>('idle');
  const [isFetchingBanks, setIsFetchingBanks] = useState(false);
  const [logoRows, setLogoRows] = useState<Record<string, unknown>[]>([]);
  const [isFetchingLogos, setIsFetchingLogos] = useState(false);
  const [bankEntries, setBankEntries] = useState<BankEntry[]>([
    { id: 'bank-entry-1', bankId: '', amount: '' },
  ]);

  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leakStatus, setLeakStatus] = useState<LeakStatus>('idle');
  const [leakValue, setLeakValue] = useState('');
  const [leakNote, setLeakNote] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [leakScore, setLeakScore] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const cardRef = React.useRef<HTMLDivElement>(null);
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
  const bankLogoMap = useMemo(() => {
    if (logoRows.length === 0) {
      return {};
    }

    const keyMap = buildLogoKeyMap(logoRows);
    const mapped: Record<string, string> = {};

    banks.forEach((bank) => {
      const idKey = normalizeKey(bank.id);
      const nameKey = normalizeKey(bank.name);
      const logo = keyMap[idKey] ?? keyMap[nameKey];
      if (logo) {
        mapped[bank.id] = logo;
      }
    });

    return mapped;
  }, [banks, logoRows]);

  useEffect(() => {
    if (!country) {
      setBanks([]);
      setBankSource('idle');
      setIsFetchingBanks(false);
      setBankEntries([{ id: 'bank-entry-1', bankId: '', amount: '' }]);
      setLogoRows([]);
      setIsFetchingLogos(false);
      setLeakStatus('idle');
      setLeakValue('');
      setLeakNote('');
      return;
    }

    let cancelled = false;
    const loadBanks = async () => {
      if (!supabase) {
        return;
      }
      
      setBankSource('idle');
      setIsFetchingBanks(true);
      setBanks([]);
      setBankEntries([{ id: `bank-entry-${Date.now()}`, bankId: '', amount: '' }]);
      setLeakStatus('idle');
      setLeakValue('');
      setLeakNote('');

      const tables = bankTableCandidates[country] ?? [];
      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select('*');
          if (error || !Array.isArray(data) || data.length === 0) {
            continue;
          }
          const normalized = normalizeBanks(data);
          if (!cancelled && normalized.length > 0) {
            setBanks(normalized);
            setBankSource('supabase');
            return;
          }
        } catch {
          // Try next table.
        }
      }
    };

    loadBanks()
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setIsFetchingBanks(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [country]);

  useEffect(() => {
    if (!country || !supabase) {
      setLogoRows([]);
      setIsFetchingLogos(false);
      return;
    }

    let cancelled = false;
    const tables = bankLogoTableCandidates[country] ?? [];

    const loadLogos = async () => {
      setIsFetchingLogos(true);
      setLogoRows([]);

      for (const table of tables) {
        try {
          const { data, error } = await supabase.from(table).select('*');
          if (!error && Array.isArray(data) && data.length > 0) {
            if (!cancelled) {
              setLogoRows(data as Record<string, unknown>[]);
            }
            return;
          }
        } catch {
          // Try next table candidate.
        }
      }
    };

    loadLogos()
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) {
          setIsFetchingLogos(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [country]);

  const handleCountryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCountry(event.target.value as CountryCode);
    setFeedbackStatus('idle');
    setFeedbackMessage('');
  };

  const handleCountrySelect = (code: CountryCode) => {
    setCountry(code);
    setFeedbackStatus('idle');
    setFeedbackMessage('');
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
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

  const labelClass = 'text-[11px] uppercase tracking-[0.2em] text-primary/60 font-bold';
  const controlClass =
    'w-full bg-white/90 border border-primary/10 rounded-2xl text-sm px-4 sm:px-5 py-3 sm:py-3.5 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 font-semibold transition-all min-w-0';

  const expandPanelClass = isExpanded
    ? 'max-h-[1200px] opacity-100 translate-y-0'
    : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none';
  const hasAnyBank = bankEntries.some((entry) => entry.bankId);
  const hasAnyAmount = bankEntries.some((entry) => entry.amount.trim());
  const completedSteps = [!!country, hasAnyBank, hasAnyAmount].filter(Boolean).length;
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
  const glowStyle = {
    background: `radial-gradient(600px circle at ${mousePos.x}% ${mousePos.y}%, rgba(29,201,106,0.08) 0%, transparent 60%)`,
  };

  return (
    <section className="relative w-full px-4 pb-16 sm:px-6">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        className="leak-card relative mx-auto w-full max-w-5xl rounded-[2.8rem] border border-primary/10 bg-white/90 p-5 sm:p-6 md:p-8 shadow-[0_35px_80px_-25px_rgba(0,0,0,0.2)] luxury-blur flex flex-col items-center gap-4 overflow-hidden group focus-within:shadow-[0_40px_90px_-20px_rgba(29,201,106,0.25)] transition-all"
      >
        {/* Interactive animated background orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="leak-orb leak-orb-1" />
          <div className="leak-orb leak-orb-2" />
          <div className="leak-orb leak-orb-3" />
          <div className="leak-orb leak-orb-4" />
          <div className="leak-orb leak-orb-5" />
          <div className="absolute inset-0 rounded-[2.8rem] border border-white/40" />
          {/* Mouse-tracking glow */}
          <div className="absolute inset-0 rounded-[2.8rem] transition-opacity duration-300 opacity-0 group-hover:opacity-100" style={glowStyle} />
        </div>

        <div className="relative w-full">
        {/* Header section */}
        <div className="w-full flex flex-col items-center gap-3 px-2 sm:px-6 text-center mb-6">
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

          {/* Progress indicator */}
          <div className="flex items-center gap-2 mt-2">
            {[0, 1, 2].map((step) => (
              <React.Fragment key={step}>
                <div
                  className={`leak-step-dot ${
                    completedSteps > step ? 'leak-step-dot-active' : ''
                  }`}
                >
                  {completedSteps > step ? (
                    <span className="material-icons text-[12px]">check</span>
                  ) : (
                    <span className="text-[10px] font-black">{step + 1}</span>
                  )}
                </div>
                {step < 2 ? (
                  <div className={`h-px w-8 transition-colors duration-500 ${
                    completedSteps > step ? 'bg-primary/40' : 'bg-primary/10'
                  }`} />
                ) : null}
              </React.Fragment>
            ))}
          </div>
        </div>

        <form onSubmit={submitLeak} className="w-full max-w-4xl mx-auto">
          <div
            className={`overflow-hidden transition-[max-height,opacity,transform] duration-500 ease-out ${expandPanelClass}`}
          >
            {/* ─── STEP 1: Country Picker ─── */}
            <div className="mb-6">
              <span className={`${labelClass} block mb-3`}>{stickyFooter.countryLabel}</span>
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                {countries.map((item) => {
                  const isActive = country === item.code;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleCountrySelect(item.code)}
                      disabled={isSubmitting}
                      className={`leak-country-card ${
                        isActive ? 'leak-country-card-active' : ''
                      }`}
                    >
                      <div className="leak-country-flag">
                        <img
                          src={flagByCountry[item.code]}
                          alt={`${item.label} flag`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] leading-tight text-center">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── STEP 2 & 3: Bank + Amount Cards ─── */}
            {country ? (
              <div className="flex flex-col gap-4 leak-slide-in">
                {bankEntries.map((entry, index) => {
                  const selectedBank = banks.find((bank) => bank.id === entry.bankId);
                  const logoUrl = entry.bankId ? bankLogoMap[entry.bankId] : null;
                  const fallbackLetter = selectedBank?.name?.charAt(0)?.toUpperCase() ?? '';

                  return (
                    <div
                      key={entry.id}
                      className="leak-bank-card"
                    >
                      {/* Bank logo / avatar */}
                      <div className="flex gap-4">
                        <div className="flex flex-col">
                          <span className={`block mb-1.5 ${index === 0 ? 'min-h-[16.5px]' : 'sr-only'} select-none`}>&nbsp;</span>
                          <div className="leak-bank-logo -mt-[2px]">
                          {isFetchingBanks || isFetchingLogos ? (
                            <div className="leak-shimmer h-full w-full rounded-2xl" />
                          ) : logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={selectedBank?.name ?? 'Bank logo'}
                              className="h-full w-full object-contain bg-white/60 p-1.5 transition-all hover:scale-105"
                              style={{ borderRadius: '16px' }}
                            />
                          ) : (
                            <>
                              {fallbackLetter ? (
                                <span className="text-lg font-bold text-primary/70">
                                  {fallbackLetter}
                                </span>
                              ) : (
                                <span className="material-icons text-primary/40 text-xl">
                                  account_balance
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col sm:flex-row gap-3">
                          {/* Bank select */}
                          <div className="flex-1 min-w-0">
                            <span className={`${labelClass} block mb-1.5 ${index === 0 ? '' : 'sr-only'}`}>
                              {stickyFooter.bankLabel}
                            </span>
                            <select
                              className={`${controlClass} flex-1`}
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
                          </div>

                          {/* Amount input */}
                          <div className="flex-1 min-w-0">
                            <span className={`${labelClass} block mb-1.5 ${index === 0 ? '' : 'sr-only'}`}>
                              {stickyFooter.amountLabel}
                            </span>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-primary/60">
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
                          </div>

                          {/* Remove button */}
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeBankEntry(entry.id)}
                              disabled={bankEntries.length === 1}
                              className="h-[46px] w-[46px] rounded-2xl border border-primary/15 flex items-center justify-center text-primary/50 transition hover:border-red-300 hover:text-red-400 hover:bg-red-50/50 disabled:cursor-not-allowed disabled:opacity-30"
                              title={stickyFooter.removeBankButton}
                            >
                              <span className="material-icons text-lg">close</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Bank source status */}
                <div className="flex flex-wrap items-center gap-2 min-h-[14px] text-[11px] font-semibold text-primary/50 px-1">
                  {isFetchingBanks ? (
                    <span className="flex items-center gap-1.5">
                      <span className="leak-dot-pulse" />
                      {stickyFooter.bankLoading}
                    </span>
                  ) : bankSource === 'supabase' ? (
                    <span className="flex items-center gap-1.5 opacity-60">
                      <span className="material-icons text-[14px]">cloud_done</span>
                      Live signals. Smarter decisions. SampadAI inside.
                    </span>
                  ) : banks.length === 0 ? (
                    <span className="text-red-400">No banks found for this country in the database.</span>
                  ) : null}
                </div>

                {/* Add bank button */}
                <button
                  type="button"
                  onClick={addBankEntry}
                  className="self-start rounded-2xl border border-dashed border-primary/25 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary/60 transition-all hover:border-primary/50 hover:text-primary hover:bg-primary/5 flex items-center gap-2"
                >
                  <span className="material-icons text-base">add</span>
                  {stickyFooter.addBankButton}
                </button>
              </div>
            ) : null}

            {/* Feedback area */}
            <div className="mt-4 flex w-full flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
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

            {/* Leak result inline */}
            {leakStatus !== 'idle' ? (
              <div className="mt-4 rounded-2xl border border-primary/10 bg-gradient-to-br from-white/80 to-primary/5 p-5 backdrop-blur text-center sm:text-left leak-slide-in">
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
                      <span className="text-2xl font-black text-primary block">{leakValue}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {/* Submit / collapse */}
          <div className="mt-5 flex flex-col items-center gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="leak-submit-btn"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="leak-dot-pulse" />
                  {localizedUi.loading}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="material-icons text-lg">water_drop</span>
                  {stickyFooter.leakButton}
                </span>
              )}
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
    </section>
  );
};

export default LeakCalculator;
