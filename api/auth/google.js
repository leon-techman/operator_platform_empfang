// GET /api/auth/google — startet den OAuth-Flow (leitet zu Google weiter).
const { oauthClient, SCOPES, configured } = require('../_lib/google');
const { getSession } = require('../_lib/store');

module.exports = async function (req, res) {
  if (!configured()) {
    res.statusCode = 302;
    res.setHeader('Location', '/?err=not_configured#integrations');
    res.end();
    return;
  }
  getSession(req, res); // setzt ggf. Session-Cookie
  const url = oauthClient(req).generateAuthUrl({
    access_type: 'offline',          // Refresh-Token anfordern
    prompt: 'consent select_account', // immer Kontoauswahl + Consent => mehrere Konten
    include_granted_scopes: true,
    scope: SCOPES
  });
  res.statusCode = 302;
  res.setHeader('Location', url);
  res.end();
};
