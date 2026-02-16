const GEO_API_TIMEOUT_MS = 3000;
const GEO_API_BASE_URL = 'https://ipapi.co';
const GEO_API_USER_AGENT = 'SampadAI-Landing-Page/1.0';

const isPrivateIP = (ip) => {
  const normalized = ip.trim().toLowerCase();
  return (
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized.startsWith('10.') ||
    normalized.startsWith('192.168.') ||
    normalized.startsWith('172.16.') ||
    normalized.startsWith('fc00:') ||
    normalized.startsWith('fd00:')
  );
};

const readHeaderValue = (headers, key) => {
  const value = headers?.[key];
  if (Array.isArray(value)) {
    return value[0] || null;
  }
  return typeof value === 'string' ? value : null;
};

const readClientIP = (req) => {
  const forwarded = readHeaderValue(req.headers, 'x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || null;
  }

  const realIP = readHeaderValue(req.headers, 'x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  return req?.socket?.remoteAddress || req?.ip || null;
};

const mapCountryToLanguage = (country) => {
  if (country === 'DE') {
    return 'de';
  }

  if (country === 'PL') {
    return 'pl';
  }

  return 'en';
};

const fetchCountryFromIP = async (ip) => {
  if (!ip || isPrivateIP(ip)) {
    return null;
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), GEO_API_TIMEOUT_MS);

  try {
    const response = await fetch(`${GEO_API_BASE_URL}/${encodeURIComponent(ip)}/country/`, {
      signal: abortController.signal,
      headers: {
        'User-Agent': GEO_API_USER_AGENT,
      },
    });

    if (!response.ok) {
      return null;
    }

    const country = (await response.text()).trim().toUpperCase();
    return country || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      success: false,
      message: 'Method not allowed.',
    });
  }

  const headerCountry = (
    readHeaderValue(req.headers, 'x-vercel-ip-country') ||
    readHeaderValue(req.headers, 'x-country-code') ||
    ''
  )
    .trim()
    .toUpperCase();

  const detectedCountry = headerCountry || (await fetchCountryFromIP(readClientIP(req)));
  const language = mapCountryToLanguage(detectedCountry);

  return res.status(200).json({
    success: true,
    language,
    country: detectedCountry || null,
  });
}
