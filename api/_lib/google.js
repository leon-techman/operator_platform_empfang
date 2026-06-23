// Shared Google OAuth helpers (CommonJS, Vercel Node functions)
const { google } = require('googleapis');

// Scopes: Konto-Identität + Gmail lesen + Gmail-Entwürfe + Kalender lesen + Kontakte lesen.
// gmail.readonly und gmail.compose sind "restricted" Scopes — im Testing-Modus mit Test-Usern
// funktionieren sie sofort; für die Veröffentlichung braucht Google eine Verifizierung.
const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/contacts.readonly'
];

function redirectUri(req) {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0];
  return proto + '://' + req.headers.host + '/api/auth/callback';
}

function oauthClient(req) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri(req)
  );
}

function clientForAccount(req, refreshToken) {
  const c = oauthClient(req);
  c.setCredentials({ refresh_token: refreshToken });
  return c;
}

function configured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

module.exports = { google, SCOPES, redirectUri, oauthClient, clientForAccount, configured };
