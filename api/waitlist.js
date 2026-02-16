import { google } from 'googleapis';

const WAITLIST_RANGE = 'Waitlist!A:D';
const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const parseServiceAccountCredentials = (rawCredentials) => {
  if (!rawCredentials) {
    return null;
  }

  try {
    return JSON.parse(rawCredentials);
  } catch {
    // Supports base64-encoded credentials if that format is used in env.
    try {
      const decoded = Buffer.from(rawCredentials, 'base64').toString('utf8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
};

const readCountryFromRequest = (req) => {
  const countryHeader = req.headers['x-vercel-ip-country'] || req.headers['x-country-code'];
  if (Array.isArray(countryHeader)) {
    return countryHeader[0] || null;
  }
  return countryHeader || null;
};

const appendWaitlistEntry = async ({ spreadsheetId, credentials, email, country }) => {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [GOOGLE_SHEETS_SCOPE],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: WAITLIST_RANGE,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[email, new Date().toISOString(), 'Active', country || 'Unknown']],
    },
  });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      success: false,
      message: 'Method not allowed.',
    });
  }

  let payload = req.body ?? {};
  if (typeof req.body === 'string') {
    try {
      payload = JSON.parse(req.body || '{}');
    } catch {
      payload = {};
    }
  }
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';

  if (!isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.',
    });
  }

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const credentials = parseServiceAccountCredentials(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

  if (!spreadsheetId || !credentials) {
    return res.status(500).json({
      success: false,
      message: 'Waitlist service is not configured.',
    });
  }

  try {
    await appendWaitlistEntry({
      spreadsheetId,
      credentials,
      email,
      country: readCountryFromRequest(req),
    });

    return res.status(200).json({
      success: true,
      message: 'Successfully added to waitlist!',
    });
  } catch (error) {
    console.error('Waitlist submission error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add to waitlist. Please try again.',
    });
  }
}
