export type CuratedBankCountryCode = 'DE' | 'PL' | 'ES' | 'GB';

export type CuratedBank = {
  id: string;
  name: string;
  country: CuratedBankCountryCode;
  logoUrl: string;
  website: string;
  aliases?: string[];
};

export const normalizeBankKey = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const curatedBanksByCountry = {
  DE: [
    {
      id: 'deutsche-bank',
      name: 'Deutsche Bank',
      country: 'DE',
      logoUrl: 'https://logo.uplead.com/deutsche-bank.de',
      website: 'https://www.deutsche-bank.de/',
      aliases: ['db'],
    },
    {
      id: 'commerzbank',
      name: 'Commerzbank',
      country: 'DE',
      logoUrl: 'https://logo.uplead.com/commerzbank.de',
      website: 'https://www.commerzbank.de/',
    },
    {
      id: 'ing',
      name: 'ING',
      country: 'DE',
      logoUrl: 'https://logo.uplead.com/ing.de',
      website: 'https://www.ing.de/',
      aliases: ['ing deutschland', 'ing-diba', 'ing diba'],
    },
    {
      id: 'dkb',
      name: 'DKB',
      country: 'DE',
      logoUrl: 'https://logo.uplead.com/dkb.de',
      website: 'https://www.dkb.de/',
      aliases: ['deutsche kreditbank'],
    },
    {
      id: 'n26',
      name: 'N26',
      country: 'DE',
      logoUrl: 'https://logo.uplead.com/n26.com',
      website: 'https://n26.com/en-eu',
      aliases: ['number26'],
    },
    {
      id: 'sparkasse',
      name: 'Sparkasse',
      country: 'DE',
      logoUrl: 'https://logo.uplead.com/sparkasse.de',
      website: 'https://www.sparkasse.de/',
      aliases: ['die sparkasse'],
    },
  ],
  PL: [
    {
      id: 'pko-bank-polski',
      name: 'PKO Bank Polski',
      country: 'PL',
      logoUrl: 'https://logo.uplead.com/pkobp.pl',
      website: 'https://www.pkobp.pl/',
      aliases: ['pko-bp', 'pko bp'],
    },
    {
      id: 'pekao',
      name: 'Bank Pekao',
      country: 'PL',
      logoUrl: 'https://logo.uplead.com/pekao.com.pl',
      website: 'https://www.pekao.com.pl/en/',
      aliases: ['bank polska kasa opieki', 'bank pekao sa'],
    },
    {
      id: 'santander-bank-polska',
      name: 'Santander Bank Polska',
      country: 'PL',
      logoUrl: 'https://logo.uplead.com/santander.pl',
      website: 'https://www.santander.pl/',
      aliases: ['bz-wbk', 'bzwbk'],
    },
    {
      id: 'ing-bank-slaski',
      name: 'ING Bank Śląski',
      country: 'PL',
      logoUrl: 'https://logo.uplead.com/ing.pl',
      website: 'https://www.ing.pl/',
      aliases: ['ing slaski', 'ing bank slaski'],
    },
    {
      id: 'mbank',
      name: 'mBank',
      country: 'PL',
      logoUrl: 'https://logo.uplead.com/mbank.pl',
      website: 'https://www.mbank.pl/en/',
      aliases: ['m-bank'],
    },
    {
      id: 'alior-bank',
      name: 'Alior Bank',
      country: 'PL',
      logoUrl: 'https://logo.uplead.com/aliorbank.pl',
      website: 'https://www.aliorbank.pl/',
      aliases: ['alior'],
    },
  ],
  ES: [
    {
      id: 'santander',
      name: 'Santander',
      country: 'ES',
      logoUrl: 'https://logo.uplead.com/santander.com',
      website: 'https://www.santander.com/en/home',
      aliases: ['banco santander'],
    },
    {
      id: 'bbva',
      name: 'BBVA',
      country: 'ES',
      logoUrl: 'https://logo.uplead.com/bbva.com',
      website: 'https://www.bbva.com/en/',
      aliases: ['banco bilbao vizcaya argentaria'],
    },
    {
      id: 'caixabank',
      name: 'CaixaBank',
      country: 'ES',
      logoUrl: 'https://logo.uplead.com/caixabank.es',
      website: 'https://www.caixabank.com/en/home_en.html',
      aliases: ['caixa bank'],
    },
    {
      id: 'banco-sabadell',
      name: 'Banco Sabadell',
      country: 'ES',
      logoUrl: 'https://logo.uplead.com/bancsabadell.com',
      website: 'https://www.bancsabadell.com/bsnacional/en/personal/',
      aliases: ['sabadell'],
    },
    {
      id: 'bankinter',
      name: 'Bankinter',
      country: 'ES',
      logoUrl: 'https://logo.uplead.com/bankinter.com',
      website: 'https://www.bankinter.com/banca/en/home',
    },
    {
      id: 'unicaja',
      name: 'Unicaja',
      country: 'ES',
      logoUrl: 'https://logo.uplead.com/unicajabanco.es',
      website: 'https://www.unicajabanco.es/',
      aliases: ['unicaja banco'],
    },
  ],
  GB: [
    {
      id: 'barclays',
      name: 'Barclays',
      country: 'GB',
      logoUrl: 'https://logo.uplead.com/barclays.co.uk',
      website: 'https://www.barclays.co.uk/',
      aliases: ['barclays bank'],
    },
    {
      id: 'hsbc-uk',
      name: 'HSBC UK',
      country: 'GB',
      logoUrl: 'https://logo.uplead.com/hsbc.co.uk',
      website: 'https://www.about.hsbc.co.uk/',
      aliases: ['hsbc', 'hsbc uk bank'],
    },
    {
      id: 'lloyds-bank',
      name: 'Lloyds Bank',
      country: 'GB',
      logoUrl: 'https://logo.uplead.com/lloydsbank.com',
      website: 'https://www.lloydsbank.com/',
      aliases: ['lloyds'],
    },
    {
      id: 'natwest',
      name: 'NatWest',
      country: 'GB',
      logoUrl: 'https://logo.uplead.com/natwest.com',
      website: 'https://www.natwest.com/',
      aliases: ['national westminster bank', 'national westminster'],
    },
    {
      id: 'nationwide',
      name: 'Nationwide',
      country: 'GB',
      logoUrl: 'https://logo.uplead.com/nationwide.co.uk',
      website: 'https://www.nationwide.co.uk/',
      aliases: ['nationwide building society'],
    },
    {
      id: 'santander-uk',
      name: 'Santander UK',
      country: 'GB',
      logoUrl: 'https://logo.uplead.com/santander.co.uk',
      website: 'https://www.santander.co.uk/',
      aliases: ['santander uk bank'],
    },
  ],
} satisfies Record<CuratedBankCountryCode, readonly CuratedBank[]>;

const buildCountryLookup = (
  banks: readonly CuratedBank[]
): Record<string, CuratedBank> => {
  const lookup: Record<string, CuratedBank> = {};

  banks.forEach((bank) => {
    const candidates = [bank.id, bank.name, ...(bank.aliases ?? [])];
    candidates.forEach((candidate) => {
      const key = normalizeBankKey(candidate);
      if (!lookup[key]) {
        lookup[key] = bank;
      }
    });
  });

  return lookup;
};

const curatedBankLookupByCountry = Object.fromEntries(
  Object.entries(curatedBanksByCountry).map(([country, banks]) => [
    country,
    buildCountryLookup(banks),
  ])
) as Record<CuratedBankCountryCode, Record<string, CuratedBank>>;

export const getCuratedBanks = (country: string): readonly CuratedBank[] =>
  curatedBanksByCountry[country as CuratedBankCountryCode] ?? [];

export const getCuratedBankLookup = (country: string): Record<string, CuratedBank> =>
  curatedBankLookupByCountry[country as CuratedBankCountryCode] ?? {};

export const findCuratedBank = (
  country: string,
  value: string | null | undefined
): CuratedBank | null => {
  if (!value) {
    return null;
  }

  return getCuratedBankLookup(country)[normalizeBankKey(value)] ?? null;
};
