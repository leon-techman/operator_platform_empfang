// GET  /api/accounts        -> Liste verbundener Google-Konten
// DELETE /api/accounts?email=foo@bar -> Konto trennen
const { getSession, listAccounts, removeAccount, storageReady } = require('./_lib/store');
const { configured } = require('./_lib/google');
const { json } = require('./_lib/http');

module.exports = async function (req, res) {
  const sid = getSession(req, res);

  if (req.method === 'DELETE') {
    const u = new URL(req.url, 'https://' + req.headers.host);
    const email = u.searchParams.get('email');
    if (email) await removeAccount(sid, email);
    return json(res, { ok: true });
  }

  const m = await listAccounts(sid);
  const accounts = Object.keys(m).map(function (e) {
    return {
      email: e,
      name: m[e].name || '',
      picture: m[e].picture || '',
      connected_at: m[e].connected_at || 0,
      token_ok: !!m[e].refresh_token
    };
  });
  json(res, { configured: configured(), storage: storageReady(), accounts: accounts });
};
