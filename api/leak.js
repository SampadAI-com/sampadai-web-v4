import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const INSURANCE_LIMITS = {
  DE: { limit: 100000, currency: 'EUR' },
  ES: { limit: 100000, currency: 'EUR' },
  PL: { limit: 100000, currency: 'EUR' }, // BFG limit is actually 100k EUR in PLN equivalent
  GB: { limit: 85000, currency: 'GBP' },
  US: { limit: 250000, currency: 'USD' },
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

    const maxRate = Math.max(...ratesData.map(r => r.interest_rate || r.rate || 0), 0.01);
    
    let totalAmount = 0;
    let weightedYield = 0;
    let overLimitAmount = 0;
    const limitInfo = INSURANCE_LIMITS[country] || { limit: 100000, currency: 'EUR' };

    banks.forEach((userBank) => {
      const amount = parseFloat(userBank.amount) || 0;
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
    const annualLeak = (maxRate - userAvgRate) * (totalAmount / 100); // rates are usually in percentages

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
      note: overLimitAmount > 0 
        ? `Money above ${limitInfo.limit} ${limitInfo.currency} in a single bank is not insured.`
        : 'Your funds are within protected insurance limits.'
    });

  } catch (error) {
    console.error('Leak calculation error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
}
