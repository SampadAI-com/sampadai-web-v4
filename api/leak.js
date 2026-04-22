import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const INSURANCE_LIMITS = {
  DE: { limit: 100000, currency: 'EUR' },
  ES: { limit: 100000, currency: 'EUR' },
  PL: { limit: 430000, currency: 'PLN' },
  GB: { limit: 85000, currency: 'GBP' },
  US: { limit: 250000, currency: 'USD' },
};

const bankTableCandidates = {
  DE: ['germany_bank', 'de_bank', 'german_bank'],
  PL: ['poland_bank', 'pl_bank'],
  US: ['usa_bank', 'us_bank', 'united_states_bank', 'america_bank'],
  ES: ['spain_bank', 'es_bank'],
  GB: ['uk_bank', 'gb_bank', 'united_kingdom_bank', 'britain_bank'],
};

const normalizeKey = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

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

const toLooseKey = (value) =>
  normalizeKey(value)
    .split('-')
    .filter((token) => token.length > 1 && !BANK_KEY_STOP_WORDS.has(token))
    .join('-');

const getKeyVariants = (value) => {
  const strict = normalizeKey(value);
  if (!strict) {
    return [];
  }

  const loose = toLooseKey(value);
  return loose && loose !== strict ? [strict, loose] : [strict];
};

const keysProbablyMatch = (left, right) => {
  if (!left || !right) {
    return false;
  }
  if (left === right) {
    return true;
  }
  return left.length >= 5 && right.length >= 5 && (left.includes(right) || right.includes(left));
};

const addKeyVariants = (keys, value) => {
  getKeyVariants(value).forEach((key) => keys.add(key));
};

const readRowString = (row, keys) => {
  for (const key of keys) {
    const value = row?.[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }
  return '';
};

const readRowNumber = (row, keys) => {
  for (const key of keys) {
    const value = row?.[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
};

const parseAmount = (value) => {
  const raw = String(value || '')
    .trim()
    .replace(/\s/g, '')
    .replace(/[^0-9.,]/g, '');
  if (!raw) {
    return 0;
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
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      normalized = raw.replace(new RegExp(`\\${separator}`, 'g'), '');
    } else if (separator === ',') {
      normalized = raw.replace(/,/g, '.');
    }
  }

  const parsed = Number.parseFloat(normalized.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const normalizeBanks = (payload) => {
  if (!payload) {
    return [];
  }

  const data = payload?.banks ?? payload;
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
        const name =
          (typeof bank.name === 'string' && bank.name.trim()) ||
          (typeof bank.bank_name === 'string' && bank.bank_name.trim()) ||
          (typeof bank.title === 'string' && bank.title.trim()) ||
          '';

        if (!name) {
          return null;
        }

        const extractId = (value) => {
          if (typeof value === 'string') return value.trim();
          if (typeof value === 'number') return String(value);
          return '';
        };

        const idCandidate =
          extractId(bank.id) || extractId(bank.bank_id) || extractId(bank.slug);

        return {
          id: idCandidate || name.toLowerCase().replace(/\s+/g, '-'),
          name,
        };
      }

      return null;
    })
    .filter(Boolean);
};

const isPlaceholderBankValue = (value) => {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return true;
  }

  const normalized = normalizeKey(trimmed);
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

const buildBankLookup = (banks) => {
  const lookup = {};

  banks.forEach((bank) => {
    [bank.id, bank.name].forEach((candidate) => {
      getKeyVariants(candidate).forEach((key) => {
        if (key && !lookup[key]) {
          lookup[key] = bank;
        }
      });
    });
  });

  return lookup;
};

const resolveBankOption = (bankLookup, rawBankId, rawBankName) => {
  const directKeys = new Set();
  addKeyVariants(directKeys, rawBankId);
  addKeyVariants(directKeys, rawBankName);

  for (const key of directKeys) {
    for (const [lookupKey, bank] of Object.entries(bankLookup)) {
      if (keysProbablyMatch(lookupKey, key)) {
        return bank;
      }
    }
  }

  return null;
};

const getRateValue = (row) => readRowNumber(row, ['interest_rate', 'rate']);
const getRateBankId = (row) => readRowString(row, ['bank_id', 'bankId', 'id', 'slug', 'code']);
const getRateBankName = (row) => readRowString(row, ['bank_name', 'name', 'bank', 'title']);
const getRateProductName = (row) =>
  readRowString(row, ['product_name', 'product', 'account_name', 'account', 'offer_name', 'rate_name']);
const getRateAccountCap = (row, fallbackLimit) => {
  const cap = readRowNumber(row, [
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
  return cap > 0 ? Math.min(cap, fallbackLimit) : fallbackLimit;
};

const findMatchingRateRow = (rows, userBank, bankLookup = {}) => {
  const matchKeys = new Set();
  const resolvedUserBank = resolveBankOption(bankLookup, userBank.bankId, userBank.bankName);

  [userBank.bankId, userBank.bankName, resolvedUserBank?.id, resolvedUserBank?.name].forEach((value) =>
    addKeyVariants(matchKeys, value)
  );

  const matches = rows.filter((row) => {
    const rowBankId = getRateBankId(row);
    const rowBankName = getRateBankName(row);
    const resolvedRowBank = resolveBankOption(bankLookup, rowBankId, rowBankName);

    const rowKeys = new Set();
    [rowBankId, rowBankName, resolvedRowBank?.id, resolvedRowBank?.name].forEach((value) =>
      addKeyVariants(rowKeys, value)
    );

    return [...rowKeys].some((rowKey) =>
      [...matchKeys].some((matchKey) => keysProbablyMatch(rowKey, matchKey))
    );
  });

  if (matches.length === 0) {
    return null;
  }

  return [...matches].sort((a, b) => getRateValue(b) - getRateValue(a))[0];
};

const buildRecommendations = (rows, totalAmount, insuranceLimit, bankLookup = {}) => {
  const seen = new Set();
  const candidates = rows
    .map((row) => {
      const rawBankId = getRateBankId(row);
      const rawBankName = getRateBankName(row);
      const bankOption = resolveBankOption(bankLookup, rawBankId, rawBankName);
      const bankName =
        (!isPlaceholderBankValue(rawBankName) ? rawBankName.trim() : '') ||
        bankOption?.name ||
        '';

      if (!bankName || isPlaceholderBankValue(bankName)) {
        return null;
      }

      const bankId =
        bankOption?.id ||
        (!isPlaceholderBankValue(rawBankId) ? rawBankId.trim() : '') ||
        normalizeKey(bankName);
      const productName = getRateProductName(row);
      const rate = getRateValue(row);
      const cap = getRateAccountCap(row, insuranceLimit);
      const bankKey = normalizeKey(bankOption?.id || bankName || bankId);
      const uniqueKey = `${bankKey}|${normalizeKey(productName || bankName)}|${rate}|${cap}`;

      if (seen.has(uniqueKey) || !bankName || rate <= 0) {
        return null;
      }

      seen.add(uniqueKey);

      return {
        bankId,
        bankKey,
        bankName,
        productName: productName && normalizeKey(productName) !== normalizeKey(bankName) ? productName : null,
        rate,
        cap,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.rate - a.rate);

  let remainingAmount = totalAmount;
  let weightedRateSum = 0;
  let protectedAmount = 0;
  const bankAllocatedTotals = {};
  const recommendations = [];

  for (const candidate of candidates) {
    if (remainingAmount <= 0) {
      break;
    }

    const bankRemaining = insuranceLimit - (bankAllocatedTotals[candidate.bankKey] || 0);
    if (bankRemaining <= 0) {
      continue;
    }

    const allocation = Math.min(remainingAmount, candidate.cap, bankRemaining);
    if (allocation <= 0) {
      continue;
    }

    bankAllocatedTotals[candidate.bankKey] = (bankAllocatedTotals[candidate.bankKey] || 0) + allocation;
    weightedRateSum += candidate.rate * allocation;
    protectedAmount += allocation;
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
    });
  }

  return {
    recommendations,
    protectedAmount,
    remainingUninsuredAmount: Math.max(0, remainingAmount),
    weightedRateSum,
  };
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  const { country, banks } = req.body || {};

  if (!country || !Array.isArray(banks) || banks.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid input. Country and banks are required.' });
  }

  if (!supabase) {
    return res.status(500).json({ success: false, message: 'Database client not initialized.' });
  }

  try {
    const tablePrefix = {
      DE: 'germany',
      PL: 'poland',
      US: 'usa',
      ES: 'spain',
      GB: 'uk',
    }[country] || country.toLowerCase();

    const interestTable = `${tablePrefix}_interest_rates`;
    
    // Fetch interest rates for the country
    const { data: ratesData, error: ratesError } = await supabase
      .from(interestTable)
      .select('*');

    if (ratesError) {
      console.error('Error fetching interest rates:', ratesError);
      // Fallback if table doesn't exist
      return res.status(200).json({
        success: true,
        score: 50,
        annualLeak: 0,
        note: 'Could not fetch live interest rates. Showing baseline estimate.',
      });
    }

    const maxRateFallback = Math.max(...ratesData.map((row) => getRateValue(row)), 0.01);
    let bankLookup = {};

    for (const table of bankTableCandidates[country] || []) {
      try {
        const { data, error } = await supabase.from(table).select('*');
        if (error || !Array.isArray(data) || data.length === 0) {
          continue;
        }

        const normalized = normalizeBanks(data);
        if (normalized.length > 0) {
          bankLookup = buildBankLookup(normalized);
          break;
        }
      } catch {
        // Try next table.
      }
    }
    
    let totalAmount = 0;
    let weightedYield = 0;
    let overLimitAmount = 0;
    const limitInfo = INSURANCE_LIMITS[country] || { limit: 100000, currency: 'EUR' };

    banks.forEach((userBank) => {
      const amount = parseAmount(userBank.amount);
      totalAmount += amount;

      const bankData = findMatchingRateRow(ratesData, userBank, bankLookup);
      const rate = bankData ? getRateValue(bankData) : 0;
      weightedYield += (rate * amount);

      if (amount > limitInfo.limit) {
        overLimitAmount += (amount - limitInfo.limit);
      }
    });

    const userAvgRate = totalAmount > 0 ? (weightedYield / totalAmount) : 0;
    const recommendationPlan = buildRecommendations(
      ratesData,
      totalAmount,
      limitInfo.limit,
      bankLookup
    );
    const maxRate =
      totalAmount > 0 && recommendationPlan.recommendations.length > 0
        ? recommendationPlan.weightedRateSum / totalAmount
        : maxRateFallback;
    const annualLeak = (maxRate - userAvgRate) * (totalAmount / 100);

    // Scoring Logic (0-100)
    // Yield Efficiency (closer to maxRate = better)
    const yieldEfficiency = maxRate > 0 ? (userAvgRate / maxRate) : 0;
    const yieldScore = yieldEfficiency * 100;

    // Safety Score (staying under insurance limit)
    const safetyRatio = totalAmount > 0 ? (overLimitAmount / totalAmount) : 0;
    const safetyScore = Math.max(0, 100 - (safetyRatio * 150)); // Penalty scales with amount over limit

    const finalScore = Math.round((yieldScore * 0.6) + (safetyScore * 0.4));

    return res.status(200).json({
      success: true,
      score: Math.min(100, Math.max(0, finalScore)),
      annualLeak: Math.round(annualLeak),
      currency: limitInfo.currency,
      userAvgRate: userAvgRate.toFixed(2),
      maxRate: maxRate.toFixed(2),
      isOverLimit: overLimitAmount > 0,
      insuranceLimit: limitInfo.limit,
      protectedAmount: recommendationPlan.protectedAmount,
      remainingUninsuredAmount: recommendationPlan.remainingUninsuredAmount,
      recommendations: recommendationPlan.recommendations,
      note: overLimitAmount > 0 
        ? `Money above ${limitInfo.limit} ${limitInfo.currency} in a single bank is not insured.`
        : 'Your funds are within protected insurance limits.'
    });

  } catch (error) {
    console.error('Leak calculation error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
