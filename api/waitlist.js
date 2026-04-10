import { google } from 'googleapis';
import { Resend } from 'resend';

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

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const welcomeEmailPromise = resend.emails.send({
          from: 'onboarding@resend.dev',
          to: email,
          subject: "You're on the list! 🚀",
          html: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #000; }
    .footer { margin-top: 30px; font-size: 12px; color: #888; }
    .button { background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">Sampada AI</div>
    <p>Hi there,</p>
    <p>Thanks for joining the waitlist for <strong>Sampada AI</strong>! We're excited to show you what we've been working on.</p>
    <p>We are currently onboarding users in small groups to maintain quality. You'll receive another email the moment your account is ready to be activated.</p>
    <p>Stay tuned,</p>
    <p><strong>The Sampada AI Team</strong></p>
    <div class="footer">
      You are receiving this because you signed up at <a href="https://sampadai.com">sampadai.com</a>.
    </div>
  </div>
</body>
</html>`,
        });

        const adminNotificationPromise = resend.emails.send({
          from: 'onboarding@resend.dev',
          to: ['the.art.of.amazement@gmail.com', 'volosach.lera@gmail.com', 'saurabh.friday@gmail.com'],
          subject: `🎉 New Waitlist Signup: ${email}`,
          html: `
            <div style="font-family: sans-serif; color: #333;">
              <h2>New Waitlist Entry!</h2>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            </div>
          `,
        });

        const [welcomeResult, adminResult] = await Promise.all([
          welcomeEmailPromise,
          adminNotificationPromise,
        ]);
        
        if (welcomeResult.error) {
          console.warn('Welcome email failed:', welcomeResult.error);
        } else {
          console.log('Successfully sent welcome email to:', email);
        }

        if (adminResult.error) {
          console.warn('Admin notification email failed:', adminResult.error);
        } else {
          console.log('Successfully sent admin notification email.');
        }
      } catch (emailError) {
        console.warn('Waitlist success, but internal error occurred sending email:', emailError);
      }
    } else {
      console.warn('RESEND_API_KEY is not defined. Skipping email notification.');
    }

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
