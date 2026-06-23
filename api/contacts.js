// GET /api/contacts — Kontakte ALLER verbundenen Google-Konten (People API).
const { getSession, listAccounts } = require('./_lib/store');
const { clientForAccount, google, configured } = require('./_lib/google');
const { json } = require('./_lib/http');

module.exports = async function (req, res) {
  const sid = getSession(req, res);
  const m = await listAccounts(sid);
  const emails = Object.keys(m);
  if (!configured() || emails.length === 0) {
    return json(res, { configured: configured(), count: 0, items: [] });
  }

  const items = [];
  const errors = [];
  for (let k = 0; k < emails.length; k++) {
    const acc = emails[k];
    try {
      const auth = clientForAccount(req, m[acc].refresh_token);
      const people = google.people({ version: 'v1', auth: auth });
      const r = await people.people.connections.list({
        resourceName: 'people/me', pageSize: 100,
        personFields: 'names,emailAddresses,phoneNumbers'
      });
      (r.data.connections || []).forEach(function (p) {
        items.push({
          account: acc,
          name: (p.names && p.names[0] && p.names[0].displayName) || '',
          email: (p.emailAddresses && p.emailAddresses[0] && p.emailAddresses[0].value) || '',
          phone: (p.phoneNumbers && p.phoneNumbers[0] && p.phoneNumbers[0].value) || ''
        });
      });
    } catch (e) {
      errors.push(acc + ': ' + ((e && e.message) || 'fehler'));
    }
  }
  json(res, { configured: true, count: items.length, items: items, errors: errors });
};
