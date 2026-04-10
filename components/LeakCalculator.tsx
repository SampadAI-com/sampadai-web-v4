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
    // { code: 'US', label: 'United States' },
    { code: 'ES', label: 'Spain' },
    { code: 'GB', label: 'United Kingdom' },
  ],
  de: [
    { code: 'DE', label: 'Deutschland' },
    { code: 'PL', label: 'Polen' },
    // { code: 'US', label: 'Vereinigte Staaten' },
    { code: 'ES', label: 'Spanien' },
    { code: 'GB', label: 'Vereinigtes Königreich' },
  ],
  pl: [
    { code: 'DE', label: 'Niemcy' },
    { code: 'PL', label: 'Polska' },
    // { code: 'US', label: 'Stany Zjednoczone' },
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

const INSURANCE_LIMITS: Record<CountryCode, { limit: number; currency: string }> = {
  DE: { limit: 100000, currency: 'EUR' },
  ES: { limit: 100000, currency: 'EUR' },
  PL: { limit: 100000, currency: 'EUR' },
  GB: { limit: 120000, currency: 'GBP' },
  US: { limit: 250000, currency: 'USD' },
};

const getCountryTablePrefix = (country: CountryCode): string => {
  return {
    DE: 'germany',
    PL: 'poland',
    US: 'usa',
    ES: 'spain',
    GB: 'uk',
  }[country] || country.toLowerCase();
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
  const candidate = data.annualLeak ?? data.leak ?? data.value ?? data.amount ?? data.estimate;
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
  const stops: { t: number; color: string }[] = [
    { t: 0, color: '#e74c3c' },     // Red (Critical)
    { t: 0.5, color: '#f39c12' },   // Orange/Yellow (Moderate)
    { t: 1, color: '#1dc96a' },     // Green (Great)
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
  const [displayScore, setDisplayScore] = useState(0);
  const [analysisStep, setAnalysisStep] = useState<number>(0);
  const [showResult, setShowResult] = useState(false);
  const [leakData, setLeakData] = useState<{
    userAvgRate: number;
    maxRate: number;
    totalAmount: number;
    annualLeak: number;
    currencyCode: string;
    isOverLimit: boolean;
  } | null>(null);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Animate score counter when leakScore changes
  useEffect(() => {
    if (leakScore !== null && leakScore > 0) {
      let animationFrame: number;
      const duration = 1800;
      const startTime = performance.now();
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        setDisplayScore(Math.round(easeProgress * leakScore));
        
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };
      
      animationFrame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrame);
    }
  }, [leakScore]);

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
    setLeakData(null);
    setLeakScore(null);
    setDisplayScore(0);

    try {
      let score = 50;
      let annualLeak = 0;
      let finalNote = stickyFooter.leakDescription;

      try {
        if (!supabase) throw new Error('Supabase not initialized');

        const tablePrefix = getCountryTablePrefix(country);
        const interestTable = `${tablePrefix}_interest_rates`;
        
        const { data: ratesData, error: ratesError } = await supabase
          .from(interestTable)
          .select('*');

        if (ratesError || !ratesData || ratesData.length === 0) {
          throw new Error('Could not fetch rates');
        }

        let totalAmount = 0;
        let weightedYield = 0;
        let overLimitAmount = 0;
        const limitInfo = INSURANCE_LIMITS[country] || { limit: 100000, currency: 'EUR' };

        parsedEntries.forEach((userBank) => {
          const amount = userBank.parsedAmount || 0;
          totalAmount += amount;

          const bankData = ratesData.find(r => 
            String(r.id) === String(userBank.bankId) || 
            String(r.bank_id) === String(userBank.bankId)
          );

          const rate = bankData ? (bankData.interest_rate || bankData.rate || 0) : 0;
          weightedYield += (rate * amount);

          if (amount > limitInfo.limit) {
            overLimitAmount += (amount - limitInfo.limit);
          }
        });

        const userAvgRate = totalAmount > 0 ? (weightedYield / totalAmount) : 0;

        // Calculate Optimal Yield respecting insurance limits
        const sortedRates = [...ratesData].sort((a, b) => {
          const rateA = a.interest_rate || a.rate || 0;
          const rateB = b.interest_rate || b.rate || 0;
          return rateB - rateA;
        });

        let remainingToAllocate = totalAmount;
        let optimalYield = 0;

        for (const bank of sortedRates) {
          if (remainingToAllocate <= 0) break;
          const rate = bank.interest_rate || bank.rate || 0;
          const allocation = Math.min(remainingToAllocate, limitInfo.limit);
          optimalYield += (rate * allocation);
          remainingToAllocate -= allocation;
        }

        if (remainingToAllocate > 0 && sortedRates.length > 0) {
          // If we maxed out all banks, put remainder in the highest yielding one
          const bestRate = sortedRates[0].interest_rate || sortedRates[0].rate || 0;
          optimalYield += (bestRate * remainingToAllocate);
        }

        const maxRate = totalAmount > 0 
          ? (optimalYield / totalAmount) 
          : Math.max(...ratesData.map(r => r.interest_rate || r.rate || 0), 0.01);
          
        annualLeak = (maxRate - userAvgRate) * (totalAmount / 100);

        const yieldEfficiency = maxRate > 0 ? (userAvgRate / maxRate) : 0;
        const yieldScore = yieldEfficiency * 100;

        const safetyRatio = totalAmount > 0 ? (overLimitAmount / totalAmount) : 0;
        const safetyScore = Math.max(0, 100 - (safetyRatio * 150));

        score = Math.round((yieldScore * 0.6) + (safetyScore * 0.4));
        finalNote = overLimitAmount > 0 
          ? `Money above ${limitInfo.limit.toLocaleString()} ${limitInfo.currency} in a single bank is not insured.`
          : 'Your funds are within protected insurance limits.';

        setLeakData({
          userAvgRate,
          maxRate,
          totalAmount,
          annualLeak,
          currencyCode: limitInfo.currency,
          isOverLimit: overLimitAmount > 0,
        });

        setLeakStatus('ready');
        setLeakValue(formatCurrencyValue(annualLeak, limitInfo.currency, language));
        setLeakNote(finalNote);
      } catch (err) {
        console.warn('Frontend algorithm fallback active:', err);
        setLeakStatus('pending');
        setLeakValue('---');
        setLeakNote(stickyFooter.leakFallback);
        score = 45;
      }

      setLeakScore(score);
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
      : leakScore >= 90
        ? stickyFooter.leakOverlayLow
        : leakScore >= 70
          ? stickyFooter.leakOverlayModerate
          : leakScore >= 50
            ? stickyFooter.leakOverlayHigh
          : leakScore >= 30
              ? stickyFooter.leakOverlayVeryHigh
              : stickyFooter.leakOverlayCritical;
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
                      className="leak-bank-card flex flex-col gap-2"
                    >
                      {/* Column Labels (Desktop only, first row only) */}
                      {index === 0 && (
                        <div className="hidden sm:flex gap-4 ml-[68px] mb-1">
                          <div className="flex-1">
                            <span className={labelClass}>{stickyFooter.bankLabel}</span>
                          </div>
                          <div className="flex-1">
                            <span className={labelClass}>{stickyFooter.amountLabel}</span>
                          </div>
                          <div className="w-[46px]" /> {/* Spacer for Remove button */}
                        </div>
                      )}

                      <div className="flex gap-4 items-start sm:items-center">
                        {/* Bank logo / avatar */}
                        <div className="leak-bank-logo shrink-0">
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

                        {/* Inputs Container */}
                        <div className="flex-1 min-w-0 flex flex-col sm:flex-row gap-3">
                          {/* Bank select */}
                          <div className="flex-1 min-w-0">
                            {/* Mobile-only label */}
                            {index === 0 && (
                              <span className={`sm:hidden ${labelClass} block mb-1.5`}>
                                {stickyFooter.bankLabel}
                              </span>
                            )}
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
                            {/* Mobile-only label */}
                            {index === 0 && (
                              <span className={`sm:hidden ${labelClass} block mb-1.5`}>
                                {stickyFooter.amountLabel}
                              </span>
                            )}
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
                                onChange={(event) => {
                                  const raw = event.target.value;
                                  // Allow only digits, dots, and commas (for EU formatting)
                                  const filtered = raw.replace(/[^0-9.,]/g, '');
                                  updateBankEntry(entry.id, { amount: filtered });
                                }}
                                disabled={!entry.bankId || isSubmitting}
                              />
                              {currency ? (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-primary/60">
                                  {currency.code}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {/* Remove button */}
                        <div className={index === 0 ? "self-end sm:self-center" : "self-center"}>
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
              <div className="mt-4 rounded-2xl border border-primary/10 bg-gradient-to-br from-white/80 to-primary/5 p-5 backdrop-blur leak-slide-in">
                {/* Header row: note + annual leak */}
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

                {/* Score bar + graph — only when ready */}
                {leakStatus === 'ready' && leakScore !== null && leakData && (
                  <div className="mt-5 flex flex-col gap-4">
                    {/* Score Bar */}
                    <div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl sm:text-4xl font-black tabular-nums" style={{ color: getThemeColorForScore(leakScore) }}>
                            {displayScore}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest text-primary/40 font-bold">/100</span>
                        </div>
                        <span 
                          className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border"
                          style={{ 
                            color: getThemeColorForScore(leakScore),
                            borderColor: `${getThemeColorForScore(leakScore)}30`,
                            backgroundColor: `${getThemeColorForScore(leakScore)}10`,
                          }}
                        >
                          {leakScore >= 80 ? 'Optimal' : leakScore >= 50 ? 'Moderate Leak' : 'Critical'}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-primary/10 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-[1800ms] ease-out"
                          style={{ 
                            width: `${displayScore}%`,
                            background: `linear-gradient(90deg, #e74c3c, #f39c12, #1dc96a)`,
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-primary/50 mt-1.5">
                        Your rate: {leakData.userAvgRate.toFixed(2)}% · Best available: {leakData.maxRate.toFixed(2)}%
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-primary/8" />

                    {/* Interactive Line Graph — 5yr Projection */}
                    {leakData.totalAmount > 0 && (() => {
                      // Compute compound growth for years 0-5
                      const years = [0, 1, 2, 3, 4, 5];
                      const userGrowth = years.map(y => leakData.totalAmount * Math.pow(1 + leakData.userAvgRate / 100, y));
                      const bestGrowth = years.map(y => leakData.totalAmount * Math.pow(1 + leakData.maxRate / 100, y));
                      
                      const allValues = [...userGrowth, ...bestGrowth];
                      const minVal = Math.min(...allValues);
                      const maxVal = Math.max(...allValues);
                      const valueRange = maxVal - minVal || 1;
                      
                      // SVG dimensions
                      const W = 460;
                      const H = 200;
                      const padL = 10;
                      const padR = 10;
                      const padT = 20;
                      const padB = 30;
                      const chartW = W - padL - padR;
                      const chartH = H - padT - padB;
                      
                      const toX = (year: number) => padL + (year / 5) * chartW;
                      const toY = (val: number) => padT + chartH - ((val - minVal) / valueRange) * chartH;
                      
                      // Build smooth SVG path using monotone cubic interpolation
                      const buildSmoothPath = (values: number[]): string => {
                        const points = values.map((v, i) => ({ x: toX(i), y: toY(v) }));
                        if (points.length < 2) return '';
                        
                        let d = `M ${points[0].x},${points[0].y}`;
                        for (let i = 0; i < points.length - 1; i++) {
                          const p0 = points[Math.max(0, i - 1)];
                          const p1 = points[i];
                          const p2 = points[i + 1];
                          const p3 = points[Math.min(points.length - 1, i + 2)];
                          
                          const cp1x = p1.x + (p2.x - p0.x) / 6;
                          const cp1y = p1.y + (p2.y - p0.y) / 6;
                          const cp2x = p2.x - (p3.x - p1.x) / 6;
                          const cp2y = p2.y - (p3.y - p1.y) / 6;
                          
                          d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
                        }
                        return d;
                      };
                      
                      const bestPath = buildSmoothPath(bestGrowth);
                      const userPath = buildSmoothPath(userGrowth);
                      
                      // Build the filled gap area between the two curves
                      const bestPointsForward = years.map((_, i) => `${toX(i)},${toY(bestGrowth[i])}`);
                      const userPointsReverse = [...years].reverse().map((_, ri) => {
                        const i = years.length - 1 - ri;
                        return `${toX(i)},${toY(userGrowth[i])}`;
                      });
                      const gapAreaPath = `M ${bestPointsForward.join(' L ')} L ${userPointsReverse.join(' L ')} Z`;
                      
                      // Format values for tooltip
                      const hYear = hoveredYear ?? 5;
                      const hBest = bestGrowth[hYear];
                      const hUser = userGrowth[hYear];
                      const hDiff = hBest - hUser;
                      
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-bold">5-Year Growth Projection</p>
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#1dc96a' }} />
                                <span className="text-[9px] text-primary/50 font-semibold">Best</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f39c12' }} />
                                <span className="text-[9px] text-primary/50 font-semibold">Yours</span>
                              </span>
                            </div>
                          </div>
                          
                          <div className="relative">
                            <svg
                              viewBox={`0 0 ${W} ${H}`}
                              className="w-full h-auto"
                              style={{ overflow: 'visible' }}
                              onMouseLeave={() => setHoveredYear(null)}
                            >
                              {/* Grid lines */}
                              {years.map(y => (
                                <line
                                  key={`grid-${y}`}
                                  x1={toX(y)} y1={padT}
                                  x2={toX(y)} y2={padT + chartH}
                                  stroke="rgba(29,201,106,0.06)"
                                  strokeWidth="1"
                                />
                              ))}
                              {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
                                <line
                                  key={`hgrid-${i}`}
                                  x1={padL} y1={padT + chartH * (1 - frac)}
                                  x2={padL + chartW} y2={padT + chartH * (1 - frac)}
                                  stroke="rgba(29,201,106,0.05)"
                                  strokeWidth="1"
                                />
                              ))}
                              
                              {/* Gap area fill */}
                              <path
                                d={gapAreaPath}
                                fill="url(#leakGapGradient)"
                                opacity="0.35"
                              />
                              
                              {/* Gradient definition */}
                              <defs>
                                <linearGradient id="leakGapGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#1dc96a" stopOpacity="0.3" />
                                  <stop offset="100%" stopColor="#f39c12" stopOpacity="0.05" />
                                </linearGradient>
                                <linearGradient id="bestLineGrad" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#1dc96a" />
                                  <stop offset="100%" stopColor="#17a356" />
                                </linearGradient>
                                <linearGradient id="userLineGrad" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#f39c12" />
                                  <stop offset="100%" stopColor="#e67e22" />
                                </linearGradient>
                              </defs>
                              
                              {/* Best rate line */}
                              <path
                                d={bestPath}
                                fill="none"
                                stroke="url(#bestLineGrad)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                className="leak-line-draw"
                              />
                              
                              {/* User rate line */}
                              <path
                                d={userPath}
                                fill="none"
                                stroke="url(#userLineGrad)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                className="leak-line-draw"
                                style={{ animationDelay: '0.2s' }}
                              />
                              
                              {/* Data points + interactive hover areas */}
                              {years.map(y => (
                                <g key={`points-${y}`}>
                                  {/* Invisible hover zone */}
                                  <rect
                                    x={toX(y) - chartW / 12}
                                    y={padT}
                                    width={chartW / 6}
                                    height={chartH}
                                    fill="transparent"
                                    className="cursor-pointer"
                                    onMouseEnter={() => setHoveredYear(y)}
                                  />
                                  
                                  {/* Vertical hover line */}
                                  {hoveredYear === y && (
                                    <line
                                      x1={toX(y)} y1={padT}
                                      x2={toX(y)} y2={padT + chartH}
                                      stroke="rgba(29,201,106,0.25)"
                                      strokeWidth="1"
                                      strokeDasharray="3,3"
                                    />
                                  )}
                                  
                                  {/* Best dot */}
                                  <circle
                                    cx={toX(y)} cy={toY(bestGrowth[y])}
                                    r={hoveredYear === y ? 5 : 3}
                                    fill="#1dc96a"
                                    stroke="white"
                                    strokeWidth="1.5"
                                    className="transition-all duration-200"
                                  />
                                  {/* User dot */}
                                  <circle
                                    cx={toX(y)} cy={toY(userGrowth[y])}
                                    r={hoveredYear === y ? 5 : 3}
                                    fill="#f39c12"
                                    stroke="white"
                                    strokeWidth="1.5"
                                    className="transition-all duration-200"
                                  />
                                </g>
                              ))}
                              
                              {/* X-axis labels */}
                              {years.map(y => (
                                <text
                                  key={`label-${y}`}
                                  x={toX(y)}
                                  y={H - 8}
                                  textAnchor="middle"
                                  className="fill-primary/40"
                                  style={{ fontSize: '7.5px', fontWeight: 600, fontFamily: 'Manrope, sans-serif', letterSpacing: '0.03em' }}
                                >
                                  {y === 0 ? 'Now' : `${y}Y`}
                                </text>
                              ))}
                            </svg>
                            
                            {/* Hover Tooltip */}
                            {hoveredYear !== null && (
                              <div 
                                className="absolute pointer-events-none px-3 py-2 rounded-xl bg-white border border-primary/15 shadow-lg shadow-primary/5 -translate-x-1/2 z-10 leak-slide-in"
                                style={{ 
                                  left: `${(hoveredYear / 5) * 100}%`,
                                  top: '-8px',
                                  transform: `translateX(-50%) translateY(-100%)`,
                                  minWidth: '140px',
                                }}
                              >
                                <p className="text-[9px] uppercase tracking-widest text-primary/50 font-bold mb-1">
                                  {hoveredYear === 0 ? 'Starting' : `After ${hoveredYear} Year${hoveredYear > 1 ? 's' : ''}`}
                                </p>
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#1dc96a]" />
                                  <span className="text-[11px] font-bold text-charcoal/80 tabular-nums">{formatCurrencyValue(hBest, leakData.currencyCode, language)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#f39c12]" />
                                  <span className="text-[11px] font-bold text-charcoal/80 tabular-nums">{formatCurrencyValue(hUser, leakData.currencyCode, language)}</span>
                                </div>
                                {hDiff > 0 && (
                                  <p className="text-[10px] font-bold text-orange-500 tabular-nums border-t border-primary/10 pt-1">
                                    -{formatCurrencyValue(hDiff, leakData.currencyCode, language)} missed
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Summary below graph */}
                          <div className="mt-3 flex justify-between items-center text-[10px]">
                            <span className="text-primary/50 font-semibold">
                              Total after 5 years at best rate: <span className="text-primary font-bold">{formatCurrencyValue(bestGrowth[5], leakData.currencyCode, language)}</span>
                            </span>
                            <span className="text-orange-500 font-bold tabular-nums">
                              -{formatCurrencyValue(bestGrowth[5] - userGrowth[5], leakData.currencyCode, language)} over 5yr
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Insurance Note */}
                    {leakData.isOverLimit && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-orange-50/80 border border-orange-200/50">
                        <span className="material-icons text-sm text-orange-500 mt-0.5">warning_amber</span>
                        <p className="text-[11px] text-orange-700/80 leading-relaxed font-medium">
                          Deposits exceeding {INSURANCE_LIMITS[country as CountryCode]?.limit.toLocaleString()} {INSURANCE_LIMITS[country as CountryCode]?.currency} per bank are not covered by deposit insurance.
                        </p>
                      </div>
                    )}
                  </div>
                )}
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
    </section>
  );
};

export default LeakCalculator;
