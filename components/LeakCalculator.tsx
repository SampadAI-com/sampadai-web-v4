import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { type Language, useLanguage } from '../context/LanguageContext';
import BankLogoBadge from './BankLogoBadge';
import {
  type CuratedBank,
  findCuratedBank,
  getCuratedBankLookup,
  getCuratedBanks,
  normalizeBankKey,
} from '../data/curatedBanks';

type CountryCode = 'DE' | 'PL' | 'US' | 'ES' | 'GB';

type BankOption = {
  id: string;
  name: string;
};

type BankSource = 'idle' | 'supabase' | 'curated';
type LeakStatus = 'idle' | 'loading' | 'ready' | 'pending';
type BankEntry = {
  id: string;
  bankId: string;
  amount: string;
};

type AllocationRecommendation = {
  bankId: string;
  bankName: string;
  productName: string | null;
  rate: number;
  allocation: number;
  annualInterest: number;
  cap: number;
  limitType: 'account' | 'bank';
  logoUrl: string | null;
};

type LeakAnalysisData = {
  userAvgRate: number;
  maxRate: number;
  totalAmount: number;
  annualLeak: number;
  currencyCode: string;
  isOverLimit: boolean;
  insuranceLimit: number;
  protectedAmount: number;
  remainingUninsuredAmount: number;
  recommendations: AllocationRecommendation[];
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
  PL: { limit: 430000, currency: 'PLN' },
  GB: { limit: 85000, currency: 'GBP' },
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

  const raw = trimmed.replace(/\s/g, '').replace(/[^0-9.,]/g, '');
  if (!raw) {
    return null;
  }

  let normalized = raw;
  const hasDot = raw.includes('.');
  const hasComma = raw.includes(',');

  if (hasDot && hasComma) {
    const lastDot = raw.lastIndexOf('.');
    const lastComma = raw.lastIndexOf(',');
    const decimalSeparator = lastDot > lastComma ? '.' : ',';
    const thousandsSeparator = decimalSeparator === '.' ? ',' : '.';

    normalized = raw.replace(new RegExp(`\\${thousandsSeparator}`, 'g'), '');
    if (decimalSeparator === ',') {
      normalized = normalized.replace(/,/g, '.');
    }
  } else if (hasDot || hasComma) {
    const separator = hasDot ? '.' : ',';
    const parts = raw.split(separator);

    // One separator with exactly 3 trailing digits is typically a thousands separator.
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      normalized = raw.replace(new RegExp(`\\${separator}`, 'g'), '');
    } else if (separator === ',') {
      normalized = raw.replace(/,/g, '.');
    }
  }

  normalized = normalized.replace(/[^0-9.]/g, '');

  const parsed = Number.parseFloat(normalized);
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

const BANK_KEY_STOP_WORDS = new Set([
  'bank',
  'banco',
  'banca',
  'banque',
  'sa',
  'ag',
  'plc',
  'llc',
  'ltd',
  'limited',
  'group',
  'holdings',
  'uk',
]);

const toLooseBankKey = (value: string): string => {
  const strict = normalizeBankKey(value);
  if (!strict) {
    return '';
  }

  return strict
    .split('-')
    .filter((token) => token.length > 1 && !BANK_KEY_STOP_WORDS.has(token))
    .join('-');
};

const getBankKeyVariants = (value: string | null | undefined): string[] => {
  if (!value) {
    return [];
  }

  const strict = normalizeBankKey(value);
  if (!strict) {
    return [];
  }

  const loose = toLooseBankKey(value);
  return loose && loose !== strict ? [strict, loose] : [strict];
};

const bankKeysProbablyMatch = (left: string, right: string): boolean => {
  if (!left || !right) {
    return false;
  }

  if (left === right) {
    return true;
  }

  if (left.length >= 5 && right.length >= 5 && (left.includes(right) || right.includes(left))) {
    return true;
  }

  return false;
};

const addBankKeyVariants = (keys: Set<string>, value: string | null | undefined): void => {
  getBankKeyVariants(value).forEach((key) => keys.add(key));
};

const findCuratedBankMatch = (
  country: CountryCode,
  value: string | null | undefined
): CuratedBank | null => {
  if (!value) {
    return null;
  }

  const direct = findCuratedBank(country, value);
  if (direct) {
    return direct;
  }

  const targetKeys = getBankKeyVariants(value);
  if (targetKeys.length === 0) {
    return null;
  }

  for (const bank of getCuratedBanks(country)) {
    const candidates = [bank.id, bank.name, ...(bank.aliases ?? [])];
    for (const candidate of candidates) {
      const candidateKeys = getBankKeyVariants(candidate);
      if (
        candidateKeys.some((candidateKey) =>
          targetKeys.some((targetKey) => bankKeysProbablyMatch(candidateKey, targetKey))
        )
      ) {
        return bank;
      }
    }
  }

  return null;
};

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

const readRowNumber = (row: Record<string, unknown>, keys: string[]): number => {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
};

const getRateValue = (row: Record<string, unknown>): number =>
  readRowNumber(row, ['interest_rate', 'rate']);

const getRateBankId = (row: Record<string, unknown>): string =>
  readRowString(row, ['bank_id', 'bankId', 'id', 'slug', 'code']) ?? '';

const getRateBankName = (row: Record<string, unknown>): string =>
  readRowString(row, ['bank_name', 'name', 'bank', 'title']) ?? '';

const getRateProductName = (row: Record<string, unknown>): string | null =>
  readRowString(row, ['product_name', 'product', 'account_name', 'account', 'offer_name', 'rate_name']);

const getRateAccountCap = (row: Record<string, unknown>, fallbackLimit: number): number => {
  const rawCap = readRowNumber(row, [
    'maximum_amount',
    'max_amount',
    'maximum_deposit',
    'max_deposit',
    'deposit_cap',
    'cap',
    'max_balance',
    'balance_cap',
    'account_limit',
    'maximum_balance',
  ]);

  if (rawCap <= 0) {
    return fallbackLimit;
  }

  return Math.min(rawCap, fallbackLimit);
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

    [id, name]
      .filter((value): value is string => Boolean(value))
      .forEach((value) => {
        const key = normalizeBankKey(value);
        if (!map[key]) {
          map[key] = logoUrl;
        }
      });
  });
  return map;
};

const isPlaceholderBankValue = (value: string | null | undefined): boolean => {
  if (!value) {
    return true;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }

  const normalized = normalizeBankKey(trimmed);
  if (!normalized) {
    return true;
  }

  return (
    /^\d+$/.test(trimmed) ||
    /^\d+$/.test(normalized) ||
    /^bank-\d+$/.test(normalized) ||
    /^id-\d+$/.test(normalized) ||
    normalized === 'bank' ||
    normalized === 'unknown'
  );
};

const buildBankOptionLookup = (options: BankOption[]): Record<string, BankOption> => {
  const lookup: Record<string, BankOption> = {};

  options.forEach((bank) => {
    [bank.id, bank.name].forEach((candidate) => {
      const key = normalizeBankKey(candidate);
      if (key && !lookup[key]) {
        lookup[key] = bank;
      }
    });
  });

  return lookup;
};

const resolveBankOption = (
  country: CountryCode,
  bankLookup: Record<string, BankOption>,
  rawBankId: string,
  rawBankName: string
): BankOption | null => {
  const directKeys = new Set<string>();
  addBankKeyVariants(directKeys, rawBankId);
  addBankKeyVariants(directKeys, rawBankName);

  for (const key of directKeys) {
    for (const [lookupKey, lookupBank] of Object.entries(bankLookup)) {
      if (bankKeysProbablyMatch(lookupKey, key)) {
        return lookupBank;
      }
    }
  }

  const curatedBank = findCuratedBankMatch(country, rawBankName) ?? findCuratedBankMatch(country, rawBankId);
  if (!curatedBank) {
    return null;
  }

  const curatedKeys = new Set<string>();
  [curatedBank.id, curatedBank.name, ...(curatedBank.aliases ?? [])].forEach((value) =>
    addBankKeyVariants(curatedKeys, value)
  );

  for (const key of curatedKeys) {
    for (const [lookupKey, lookupBank] of Object.entries(bankLookup)) {
      if (bankKeysProbablyMatch(lookupKey, key)) {
        return lookupBank;
      }
    }
  }

  return null;
};

const resolveRecommendationBank = ({
  country,
  bankLookup,
  logoKeyMap,
  rawBankId,
  rawBankName,
}: {
  country: CountryCode;
  bankLookup: Record<string, BankOption>;
  logoKeyMap: Record<string, string>;
  rawBankId: string;
  rawBankName: string;
}): {
  bankId: string;
  bankKey: string;
  bankName: string;
  logoUrl: string | null;
} | null => {
  const bankOption = resolveBankOption(country, bankLookup, rawBankId, rawBankName);
  const curatedBank =
    findCuratedBankMatch(country, rawBankName) ??
    findCuratedBankMatch(country, rawBankId) ??
    findCuratedBankMatch(country, bankOption?.name) ??
    findCuratedBankMatch(country, bankOption?.id);

  // Prefer resolved names, but always fall back to raw values so rows are never silently dropped.
  let bankName =
    (!isPlaceholderBankValue(rawBankName) ? rawBankName.trim() : '') ||
    bankOption?.name ||
    curatedBank?.name ||
    (!isPlaceholderBankValue(rawBankId) ? rawBankId.trim() : '') ||
    '';

  if (!bankName) {
    bankName = rawBankName?.trim() || rawBankId?.trim() || 'Unknown Bank';
  }

  const bankId =
    bankOption?.id ||
    curatedBank?.id ||
    (!isPlaceholderBankValue(rawBankId) ? rawBankId.trim() : '') ||
    normalizeBankKey(bankName);

  return {
    bankId,
    bankKey: normalizeBankKey(bankOption?.id || curatedBank?.id || bankName || bankId),
    bankName,
    logoUrl: resolveBankLogo(country, logoKeyMap, bankId, bankName),
  };
};

const resolveBankLogo = (
  country: CountryCode,
  logoKeyMap: Record<string, string>,
  bankId: string,
  bankName: string
): string | null => {
  const idKey = bankId ? normalizeBankKey(bankId) : '';
  const nameKey = bankName ? normalizeBankKey(bankName) : '';

  return (
    logoKeyMap[idKey] ??
    logoKeyMap[nameKey] ??
    findCuratedBankMatch(country, bankId)?.logoUrl ??
    findCuratedBankMatch(country, bankName)?.logoUrl ??
    null
  );
};

const buildAllocationRecommendations = ({
  country,
  bankLookup,
  rows,
  totalAmount,
  insuranceLimit,
  logoKeyMap,
}: {
  country: CountryCode;
  bankLookup: Record<string, BankOption>;
  rows: Record<string, unknown>[];
  totalAmount: number;
  insuranceLimit: number;
  logoKeyMap: Record<string, string>;
}): {
  recommendations: AllocationRecommendation[];
  protectedAmount: number;
  remainingUninsuredAmount: number;
  weightedRateSum: number;
} => {
  if (totalAmount <= 0 || rows.length === 0) {
    return {
      recommendations: [],
      protectedAmount: 0,
      remainingUninsuredAmount: totalAmount,
      weightedRateSum: 0,
    };
  }

  const seenCandidates = new Set<string>();
  const candidates = rows
    .map((row) => {
      const resolvedBank = resolveRecommendationBank({
        country,
        bankLookup,
        logoKeyMap,
        rawBankId: getRateBankId(row),
        rawBankName: getRateBankName(row),
      });
      if (!resolvedBank) {
        return null;
      }

      const normalizedBankName = normalizeBankKey(resolvedBank.bankName);
      const productNameRaw = getRateProductName(row);
      const productName =
        productNameRaw && normalizeBankKey(productNameRaw) !== normalizedBankName
          ? productNameRaw
          : null;
      const rate = getRateValue(row);
      const cap = getRateAccountCap(row, insuranceLimit);
      const uniqueKey = `${resolvedBank.bankKey}|${normalizeBankKey(productName ?? resolvedBank.bankName)}|${rate}|${cap}`;

      if (seenCandidates.has(uniqueKey)) {
        return null;
      }

      seenCandidates.add(uniqueKey);

      return {
        bankId: resolvedBank.bankId,
        bankKey: resolvedBank.bankKey,
        bankName: resolvedBank.bankName,
        productName,
        rate,
        cap,
        logoUrl: resolvedBank.logoUrl,
      };
    })
    .filter(
      (
        candidate
      ): candidate is {
        bankId: string;
        bankKey: string;
        bankName: string;
        productName: string | null;
        rate: number;
        cap: number;
        logoUrl: string | null;
      } => Boolean(candidate && candidate.bankName && candidate.rate > 0)
    )
    .sort((a, b) => b.rate - a.rate);

  let remainingAmount = totalAmount;
  let protectedAmount = 0;
  let weightedRateSum = 0;
  const bankAllocatedTotals: Record<string, number> = {};
  const recommendations: AllocationRecommendation[] = [];

  candidates.forEach((candidate) => {
    if (remainingAmount <= 0) {
      return;
    }

    const bankRemaining = insuranceLimit - (bankAllocatedTotals[candidate.bankKey] ?? 0);
    if (bankRemaining <= 0) {
      return;
    }

    const allocation = Math.min(remainingAmount, candidate.cap, bankRemaining);
    if (allocation <= 0) {
      return;
    }

    bankAllocatedTotals[candidate.bankKey] =
      (bankAllocatedTotals[candidate.bankKey] ?? 0) + allocation;
    protectedAmount += allocation;
    weightedRateSum += candidate.rate * allocation;
    remainingAmount -= allocation;

    recommendations.push({
      bankId: candidate.bankId,
      bankName: candidate.bankName,
      productName: candidate.productName,
      rate: candidate.rate,
      allocation,
      annualInterest: (candidate.rate * allocation) / 100,
      cap: candidate.cap,
      limitType: candidate.cap < insuranceLimit ? 'account' : 'bank',
      logoUrl: candidate.logoUrl,
    });
  });

  return {
    recommendations,
    protectedAmount,
    remainingUninsuredAmount: Math.max(0, remainingAmount),
    weightedRateSum,
  };
};

const findMatchingRateRow = (
  rows: Record<string, unknown>[],
  country: CountryCode,
  entry: BankEntry,
  selectedBank: BankOption | undefined,
  bankLookup: Record<string, BankOption>
): Record<string, unknown> | undefined => {
  const matchKeys = new Set<string>();
  const resolvedSelected = resolveBankOption(
    country,
    bankLookup,
    entry.bankId,
    selectedBank?.name ?? ''
  );
  const curatedBank =
    findCuratedBankMatch(country, entry.bankId) ??
    findCuratedBankMatch(country, selectedBank?.name) ??
    findCuratedBankMatch(country, resolvedSelected?.name) ??
    findCuratedBankMatch(country, resolvedSelected?.id);

  [
    entry.bankId,
    selectedBank?.name,
    resolvedSelected?.id,
    resolvedSelected?.name,
    curatedBank?.id,
    curatedBank?.name,
    ...(curatedBank?.aliases ?? []),
  ].forEach((value) => addBankKeyVariants(matchKeys, value));

  const matchingRows = rows.filter((row) => {
    const rowBankId = getRateBankId(row);
    const rowBankName = getRateBankName(row);
    const resolvedRow = resolveBankOption(country, bankLookup, rowBankId, rowBankName);
    const curatedRow =
      findCuratedBankMatch(country, rowBankId) ??
      findCuratedBankMatch(country, rowBankName) ??
      findCuratedBankMatch(country, resolvedRow?.name) ??
      findCuratedBankMatch(country, resolvedRow?.id);

    const rowKeys = new Set<string>();
    [
      rowBankId,
      rowBankName,
      resolvedRow?.id,
      resolvedRow?.name,
      curatedRow?.id,
      curatedRow?.name,
      ...(curatedRow?.aliases ?? []),
    ].forEach((value) => addBankKeyVariants(rowKeys, value));

    return [...rowKeys].some((rowKey) =>
      [...matchKeys].some((matchKey) => bankKeysProbablyMatch(rowKey, matchKey))
    );
  });

  if (matchingRows.length === 0) {
    return undefined;
  }

  return [...matchingRows].sort((a, b) => getRateValue(b) - getRateValue(a))[0];
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

type AllocationPanelProps = {
  leakData: LeakAnalysisData;
  language: Language;
  stickyFooter: ReturnType<typeof useLanguage>['messages']['stickyFooter'];
};

const AllocationPanel: React.FC<AllocationPanelProps> = ({ leakData, language, stickyFooter }) => {
  const [open, setOpen] = React.useState(true);
  const displayedRecs = leakData.recommendations.slice(0, 3);
  const hiddenCount = leakData.recommendations.length - displayedRecs.length;

  React.useEffect(() => {
    setOpen(true);
  }, [leakData]);

  return (
    <div className="rounded-[1.6rem] border border-primary/10 bg-white/80 overflow-hidden">

      {/* ── Header / toggle ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full p-4 sm:p-5 text-left hover:bg-primary/[0.03] transition-colors"
      >
        {/* Row 1: title + chevron */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-bold">
              {stickyFooter.allocationTitle}
            </p>
            <p className="mt-0.5 text-xs text-charcoal/50 leading-relaxed hidden sm:block max-w-xl">
              {stickyFooter.allocationDescription}
            </p>
          </div>
          <span
            className="material-icons text-primary/40 text-xl shrink-0 mt-0.5 transition-transform duration-300"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            expand_more
          </span>
        </div>
        {/* Row 2: summary chips always visible, wrap-safe */}
        <div className="mt-2.5 flex flex-wrap gap-2">
          <div className="rounded-xl border border-primary/10 bg-primary/5 px-3 py-1.5">
            <p className="text-[9px] uppercase tracking-widest text-charcoal/40 font-semibold">{stickyFooter.allocationCoverage}</p>
            <p className="text-sm font-black text-charcoal tabular-nums">
              {formatCurrencyValue(leakData.protectedAmount, leakData.currencyCode, language)}
            </p>
          </div>
          <div className="rounded-xl border border-primary/10 bg-primary/5 px-3 py-1.5">
            <p className="text-[9px] uppercase tracking-widest text-charcoal/40 font-semibold">{stickyFooter.allocationBlend}</p>
            <p className="text-sm font-black text-primary tabular-nums">
              {leakData.maxRate.toFixed(2)}%
            </p>
          </div>
        </div>
      </button>

      {/* ── Collapsible body ── */}
      {open && (
        <div className="mt-2 border-t border-primary/[0.08]">
        {/* Desktop column headers */}
        <div className="alloc-desktop-row gap-x-4 items-center px-5 py-2 bg-primary/[0.02]">
          <div className="w-5 shrink-0" />
          <div className="flex-[1.5] min-w-0 pl-2">
            <p className="text-[9px] uppercase tracking-[0.18em] text-charcoal/35 font-bold pl-11">{stickyFooter.bankLabel}</p>
          </div>
          <div className="flex-1 min-w-0"><p className="text-[9px] uppercase tracking-[0.18em] text-charcoal/35 font-bold">{stickyFooter.allocationAmount}</p></div>
          <div className="flex-1 min-w-0"><p className="text-[9px] uppercase tracking-[0.18em] text-charcoal/35 font-bold">{stickyFooter.allocationInterest}</p></div>
          <div className="flex-1 min-w-0"><p className="text-[9px] uppercase tracking-[0.18em] text-charcoal/35 font-bold">{stickyFooter.allocationRate}</p></div>
          <div className="flex-1 min-w-0"><p className="text-[9px] uppercase tracking-[0.18em] text-charcoal/35 font-bold">{stickyFooter.allocationBankCap}</p></div>
        </div>

        {/* Bank rows */}
        <div className="divide-y divide-primary/[0.06] border-t border-primary/[0.08]">
          {displayedRecs.map((rec, index) => (
            <div
              key={`${rec.bankId}-${rec.productName ?? 'bank'}-${index}`}
              className="px-4 sm:px-5 py-3 hover:bg-primary/[0.02] transition-colors"
            >
              {/* Desktop: single flex row */}
              <div className="alloc-desktop-row gap-x-4 items-center">
                <div className="w-5 shrink-0 flex justify-center">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-black text-primary">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-[1.5] flex items-center gap-2.5 min-w-0 pl-2">
                  <BankLogoBadge
                    name={rec.bankName}
                    logoUrl={rec.logoUrl}
                    className="h-9 w-9 min-w-[2.25rem] rounded-xl shrink-0"
                    imageClassName="p-1.5"
                    fallbackClassName="text-sm"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-charcoal leading-tight truncate">{rec.bankName}</p>
                    {rec.productName ? <p className="text-[10px] text-charcoal/40 truncate">{rec.productName}</p> : null}
                  </div>
                </div>
                <div className="flex-1 min-w-0"><p className="text-sm font-bold text-charcoal tabular-nums truncate">{formatCurrencyValue(rec.allocation, leakData.currencyCode, language)}</p></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-bold text-charcoal tabular-nums truncate">{formatCurrencyValue(rec.annualInterest, leakData.currencyCode, language)}</p></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-bold text-primary tabular-nums truncate">{rec.rate.toFixed(2)}%</p></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-bold text-charcoal/50 tabular-nums truncate">{formatCurrencyValue(rec.cap, leakData.currencyCode, language)}</p></div>
              </div>

              {/* Mobile: stacked card layout */}
              <div className="alloc-mobile-row">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-black text-primary">
                    {index + 1}
                  </span>
                  <BankLogoBadge
                    name={rec.bankName}
                    logoUrl={rec.logoUrl}
                    className="h-8 w-8 min-w-[2rem] rounded-xl shrink-0"
                    imageClassName="p-1.5"
                    fallbackClassName="text-sm"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-charcoal leading-tight truncate">{rec.bankName}</p>
                    {rec.productName ? <p className="text-[10px] text-charcoal/40 truncate">{rec.productName}</p> : null}
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 pl-1">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-charcoal/35 font-semibold">{stickyFooter.allocationAmount}</p>
                    <p className="text-sm font-bold text-charcoal tabular-nums">{formatCurrencyValue(rec.allocation, leakData.currencyCode, language)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-charcoal/35 font-semibold">{stickyFooter.allocationInterest}</p>
                    <p className="text-sm font-bold text-charcoal tabular-nums">{formatCurrencyValue(rec.annualInterest, leakData.currencyCode, language)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-charcoal/35 font-semibold">{stickyFooter.allocationRate}</p>
                    <p className="text-sm font-bold text-primary tabular-nums">{rec.rate.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-charcoal/35 font-semibold">
                      {rec.limitType === 'account' ? stickyFooter.allocationProductCap : stickyFooter.allocationBankCap}
                    </p>
                    <p className="text-sm font-bold text-charcoal/50 tabular-nums">{formatCurrencyValue(rec.cap, leakData.currencyCode, language)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="px-4 sm:px-5 py-3 border-t border-primary/[0.08] flex flex-col gap-3">
          {hiddenCount > 0 && (
            <div className="flex items-center gap-2 px-1">
              <span className="material-icons text-sm text-primary/40 shrink-0">more_horiz</span>
              <p className="text-xs text-charcoal/50 font-medium">
                {stickyFooter.allocationHiddenBanksNote?.replace('{count}', hiddenCount.toString()) ?? `... and ${hiddenCount} more banks protecting your money`}
              </p>
            </div>
          )}
          
          {leakData.remainingUninsuredAmount > 0 ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-orange-200/60 bg-orange-50/85 px-3.5 py-2.5">
              <span className="material-icons text-sm text-orange-500 mt-0.5 shrink-0">priority_high</span>
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-orange-600/80 font-bold">
                  {stickyFooter.allocationRemainderTitle}
                </p>
                <p className="mt-0.5 text-xs text-orange-700/85 leading-relaxed">
                  {stickyFooter.allocationRemainderNote.replace(
                    '{amount}',
                    formatCurrencyValue(leakData.remainingUninsuredAmount, leakData.currencyCode, language)
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-primary/10 bg-primary/5 px-3.5 py-2.5">
              <span className="material-icons text-sm text-primary shrink-0">verified_user</span>
              <p className="text-xs text-primary/80 font-medium leading-relaxed">
                {stickyFooter.allocationProtectedNote}
              </p>
            </div>
          )}
        </div>
        </div>
      )}
    </div>
  );
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
  const [leakData, setLeakData] = useState<LeakAnalysisData | null>(null);
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [isWaitlistSubmitting, setIsWaitlistSubmitting] = useState(false);
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [waitlistMessage, setWaitlistMessage] = useState('');
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
  const curatedBankLookup = useMemo(
    () => (country ? getCuratedBankLookup(country) : {}),
    [country]
  );
  const logoRowKeyMap = useMemo(() => buildLogoKeyMap(logoRows), [logoRows]);
  const bankOptionLookup = useMemo(() => buildBankOptionLookup(banks), [banks]);
  const bankLogoMap = useMemo(() => {
    const mapped: Record<string, string> = {};

    banks.forEach((bank) => {
      const idKey = normalizeBankKey(bank.id);
      const nameKey = normalizeBankKey(bank.name);
      const logo =
        logoRowKeyMap[idKey] ??
        logoRowKeyMap[nameKey] ??
        curatedBankLookup[idKey]?.logoUrl ??
        curatedBankLookup[nameKey]?.logoUrl;
      if (logo) {
        mapped[bank.id] = logo;
      }
    });

    return mapped;
  }, [banks, curatedBankLookup, logoRowKeyMap]);

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
      const curatedFallbackBanks = getCuratedBanks(country).map(({ id, name }) => ({
        id,
        name,
      }));

      const applyCuratedFallback = () => {
        if (!cancelled) {
          setBanks(curatedFallbackBanks);
          setBankSource(curatedFallbackBanks.length > 0 ? 'curated' : 'idle');
        }
      };

      setBankSource('idle');
      setIsFetchingBanks(true);
      setBanks([]);
      setBankEntries([{ id: `bank-entry-${Date.now()}`, bankId: '', amount: '' }]);
      setLeakStatus('idle');
      setLeakValue('');
      setLeakNote('');

      if (!supabase) {
        applyCuratedFallback();
        return;
      }

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

      applyCuratedFallback();
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

      // Helper: build curated-bank rate rows as a fallback when Supabase has no data.
      // Assigns representative market rates based on country averages.
      const buildCuratedRateRows = (): Record<string, unknown>[] => {
        const curatedBanks = getCuratedBanks(country);
        // Assign representative rates (descending) so top banks get better allocations.
        const baseRates: Record<CountryCode, number[]> = {
          DE: [3.5, 3.2, 2.8, 2.5, 2.2, 2.0],
          PL: [5.5, 5.2, 4.8, 4.5, 4.2, 4.0],
          ES: [3.0, 2.8, 2.5, 2.2, 2.0, 1.8],
          GB: [4.5, 4.2, 3.9, 3.6, 3.3, 3.0],
          US: [5.0, 4.7, 4.4, 4.1, 3.8, 3.5],
        };
        const rates = baseRates[country] ?? [3.0, 2.5, 2.0, 1.8, 1.5, 1.2];
        return curatedBanks.map((bank, i) => ({
          bank_id: bank.id,
          bank_name: bank.name,
          interest_rate: rates[Math.min(i, rates.length - 1)],
        }));
      };

      try {
        const limitInfo = INSURANCE_LIMITS[country] || { limit: 100000, currency: 'EUR' };
        let ratesRows: Record<string, unknown>[] = [];

        // Attempt to load live rates from Supabase.
        if (supabase) {
          const tablePrefix = getCountryTablePrefix(country);
          const interestTable = `${tablePrefix}_interest_rates`;
          try {
            const { data: ratesData, error: ratesError } = await supabase
              .from(interestTable)
              .select('*');
            if (!ratesError && Array.isArray(ratesData) && ratesData.length > 0) {
              ratesRows = ratesData as Record<string, unknown>[];
            }
          } catch {
            // Supabase fetch failed — fall through to curated fallback.
          }
        }

        // Always fall back to curated rates if live data is unavailable.
        if (ratesRows.length === 0) {
          ratesRows = buildCuratedRateRows();
        }

        let totalAmount = 0;
        let weightedYield = 0;
        let overLimitAmount = 0;

        parsedEntries.forEach((userBank) => {
          const amount = userBank.parsedAmount || 0;
          totalAmount += amount;

          const selectedBank = banks.find((bank) => bank.id === userBank.bankId);
          const bankData = findMatchingRateRow(
            ratesRows,
            country,
            userBank,
            selectedBank,
            bankOptionLookup
          );

          const rate = bankData ? getRateValue(bankData) : 0;
          weightedYield += (rate * amount);

          if (amount > limitInfo.limit) {
            overLimitAmount += (amount - limitInfo.limit);
          }
        });

        const userAvgRate = totalAmount > 0 ? (weightedYield / totalAmount) : 0;
        const allocationPlan = buildAllocationRecommendations({
          country,
          bankLookup: bankOptionLookup,
          rows: ratesRows,
          totalAmount,
          insuranceLimit: limitInfo.limit,
          logoKeyMap: logoRowKeyMap,
        });

        const absoluteMaxRate = Math.max(...ratesRows.map(getRateValue), 0.01);
        
        // maxRate represents the absolute best rate available in the market for UI comparison
        const maxRate = absoluteMaxRate;

        // annualLeak = what user misses per year vs optimal allocation.
        // The optimal allocation protects as much as possible, and assumes the remaining
        // uninsured amount (if any) could earn at least the absolute max rate.
        const optimalProtectedInterest = allocationPlan.weightedRateSum / 100;
        const optimalUninsuredInterest = (allocationPlan.remainingUninsuredAmount * absoluteMaxRate) / 100;
        const bestAnnualInterest = optimalProtectedInterest + optimalUninsuredInterest;
        
        // User's annual interest across their entire deposited amount.
        const userAnnualInterest = (userAvgRate * totalAmount) / 100;
        // Leak is the difference — clamped to 0 so it never goes negative.
        annualLeak = Math.max(0, bestAnnualInterest - userAnnualInterest);

        const yieldEfficiency = maxRate > 0 ? Math.min(userAvgRate / maxRate, 1) : 0;
        const yieldScore = yieldEfficiency * 100;

        const safetyRatio = totalAmount > 0 ? Math.min(overLimitAmount / totalAmount, 1) : 0;
        const safetyScore = Math.max(0, 100 - (safetyRatio * 150));

        score = Math.min(100, Math.max(0, Math.round((yieldScore * 0.6) + (safetyScore * 0.4))));
        finalNote = overLimitAmount > 0
          ? stickyFooter.insuranceNoteOverLimit
              .replace('{limit}', limitInfo.limit.toLocaleString())
              .replace('{currency}', limitInfo.currency)
          : stickyFooter.insuranceNoteSafe;

        setLeakData({
          userAvgRate,
          maxRate,
          totalAmount,
          annualLeak,
          currencyCode: limitInfo.currency,
          isOverLimit: overLimitAmount > 0,
          insuranceLimit: limitInfo.limit,
          protectedAmount: allocationPlan.protectedAmount,
          remainingUninsuredAmount: allocationPlan.remainingUninsuredAmount,
          recommendations: allocationPlan.recommendations,
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

  const submitWaitlist = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setWaitlistStatus('error');
      setWaitlistMessage(stickyFooter.waitlistPlaceholder);
      return;
    }
    
    setIsWaitlistSubmitting(true);
    setWaitlistStatus('idle');
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (data.success) {
        setWaitlistStatus('success');
        setWaitlistMessage(stickyFooter.waitlistSuccess);
        setEmail('');
      } else {
        setWaitlistStatus('error');
        setWaitlistMessage(data.message || 'Error joining waitlist.');
      }
    } catch {
      setWaitlistStatus('error');
      setWaitlistMessage('Error connecting to waitlist.');
    } finally {
      setIsWaitlistSubmitting(false);
    }
  };

  const labelClass = 'text-[11px] uppercase tracking-[0.2em] text-primary/60 font-bold';
  const controlClass =
    'w-full bg-white/90 border border-primary/10 rounded-2xl text-sm px-4 sm:px-5 py-3 sm:py-3.5 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 font-semibold transition-all min-w-0';

  const expandPanelClass = isExpanded
    ? 'max-h-[2000px] opacity-100 translate-y-0'
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

                      <div className="grid grid-cols-[52px_1fr_46px] sm:flex sm:flex-row gap-3 sm:gap-4 items-start sm:items-center w-full">
                        {/* Bank logo / avatar */}
                        <div className={`leak-bank-logo shrink-0 col-start-1 row-span-2 place-self-start sm:place-self-auto ${index === 0 ? 'mt-[22px] sm:mt-0' : ''}`}>
                          {isFetchingBanks || isFetchingLogos ? (
                            <div className="leak-shimmer h-full w-full rounded-2xl" />
                          ) : selectedBank ? (
                            <BankLogoBadge
                              name={selectedBank.name}
                              logoUrl={logoUrl}
                              className="h-full w-full rounded-[16px] border-0 bg-transparent shadow-none"
                              imageClassName="bg-white/60 p-1.5 transition-all hover:scale-105"
                              fallbackClassName="text-lg"
                            />
                          ) : (
                            <span className="material-icons text-primary/40 text-xl">
                              account_balance
                            </span>
                          )}
                        </div>

                        {/* Bank select */}
                        <div className="col-start-2 col-span-2 sm:col-span-1 sm:flex-1 min-w-0 w-full">
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
                        <div className="col-start-2 col-span-1 sm:flex-1 min-w-0 w-full">
                          {index === 0 && (
                            <span className={`sm:hidden ${labelClass} block mb-1.5 mt-1 sm:mt-0`}>
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

                        {/* Remove button */}
                        <div className="col-start-3 row-start-2 self-end sm:self-center">
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
                      {stickyFooter.signalsInside}
                    </span>
                  ) : bankSource === 'curated' ? (
                    <span className="flex items-center gap-1.5 opacity-60">
                      <span className="material-icons text-[14px]">verified</span>
                      {stickyFooter.bankFallback}
                    </span>
                  ) : banks.length === 0 ? (
                    <span className="text-red-400">{stickyFooter.bankEmpty}</span>
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
                          {leakScore >= 80 ? stickyFooter.optimal : leakScore >= 50 ? stickyFooter.moderateLeakStatus : stickyFooter.criticalLeakStatus}
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
                        {stickyFooter.yourRate} {leakData.userAvgRate.toFixed(2)}% · {stickyFooter.bestProtected} {leakData.maxRate.toFixed(2)}%
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
                            <p className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-bold">{stickyFooter.projectionTitle}</p>
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#1dc96a' }} />
                                <span className="text-[9px] text-primary/50 font-semibold">{stickyFooter.bestLabel}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f39c12' }} />
                                <span className="text-[9px] text-primary/50 font-semibold">{stickyFooter.yoursLabel}</span>
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
                                  {y === 0 ? stickyFooter.nowLabel : `${y}${stickyFooter.yearsLabel}`}
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
                                  {hoveredYear === 0 ? stickyFooter.startingLabel : stickyFooter.afterYearLabel.replace('{year}', String(hoveredYear))}
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
                                    -{formatCurrencyValue(hDiff, leakData.currencyCode, language)} {stickyFooter.missedLabel}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Summary below graph */}
                          <div className="mt-3 flex justify-between items-center text-[10px]">
                            <span className="text-primary/50 font-semibold">
                              {stickyFooter.totalAfter5Years} <span className="text-primary font-bold">{formatCurrencyValue(bestGrowth[5], leakData.currencyCode, language)}</span>
                            </span>
                            <span className="text-orange-500 font-bold tabular-nums">
                              -{formatCurrencyValue(bestGrowth[5] - userGrowth[5], leakData.currencyCode, language)} {stickyFooter.over5Yr}
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Protected allocation plan — collapsible */}
                    {leakData.recommendations.length > 0 ? (
                      <AllocationPanel
                        leakData={leakData}
                        language={language}
                        stickyFooter={stickyFooter}
                      />
                    ) : null}

                    {/* Insurance Note */}
                    {leakData.isOverLimit && (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-orange-50/80 border border-orange-200/50">
                        <span className="material-icons text-sm text-orange-500 mt-0.5">warning_amber</span>
                        <p className="text-[11px] text-orange-700/80 leading-relaxed font-medium">
                          {stickyFooter.insuranceWarning
                            .replace('{limit}', INSURANCE_LIMITS[country as CountryCode]?.limit.toLocaleString())
                            .replace('{currency}', INSURANCE_LIMITS[country as CountryCode]?.currency)}
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
            {leakStatus === 'ready' ? (
              <div className="w-full max-w-sm flex flex-col gap-2 leak-slide-in mb-2 mt-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setWaitlistStatus('idle');
                      setWaitlistMessage('');
                    }}
                    disabled={isWaitlistSubmitting || waitlistStatus === 'success'}
                    placeholder={stickyFooter.waitlistPlaceholder}
                    className="flex-1 bg-white/90 border border-primary/20 rounded-2xl text-sm px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary/40 font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={submitWaitlist}
                    disabled={isWaitlistSubmitting || waitlistStatus === 'success' || !email}
                    className="bg-primary text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center min-w-[140px]"
                  >
                    {isWaitlistSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="leak-dot-pulse bg-white/80" />
                      </span>
                    ) : waitlistStatus === 'success' ? (
                      <span className="material-icons text-white text-lg">check</span>
                    ) : (
                      stickyFooter.waitlistButton
                    )}
                  </button>
                </div>
                {waitlistMessage && (
                  <p className={`text-xs text-center font-medium ${waitlistStatus === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {waitlistMessage}
                  </p>
                )}
              </div>
            ) : (
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
            )}
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
