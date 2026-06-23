// GET /api/auth/callback — Google leitet hierher zurück, Code -> Tokens, Konto speichern.
const { oauthClient, google } = require('../_lib/google');
const { getSession, saveAccount, storageReady } = require('../_lib/store');

function redir(res, loc) { res.statusCode = 302; res.setHeader('Location', loc); res.end(); }

module.exports = async function (req, res) {
  const sid = getSession(req, res);
  try {
    const u = new URL(req.url, 'https://' + req.headers.host);
    const err = u.searchParams.get('error');
    const code = u.searchParams.get('code');
    if (err) return redir(res, '/?err=' + encodeURIComponent(err) + '#integrations');
    if (!code) return redir(res, '/?err=nocode#integrations');

    const client = oauthClient(req);
    const r = await client.getToken(code);
    const tokens = r.tokens;
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const me = await oauth2.userinfo.get();
    const email = (me.data && me.data.email) || ('konto-' + Date.now());

    await saveAccount(sid, email, {
      refresh_token: tokens.refresh_token || null,
      name: (me.data && me.data.name) || '',
      picture: (me.data && me.data.picture) || '',
      connected_at: Date.now()
    });

    const warn = storageReady() ? '' : '&warn=nostore';
    return redir(res, '/?connected=' + encodeURIComponent(email) + warn + '#integrations');
  } catch (e) {
    return redir(res, '/?err=' + encodeURIComponent((e && e.message) || 'oauth_failed') + '#integrations');
  }
};
