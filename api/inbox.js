// GET /api/inbox — aggregiert die Posteingänge ALLER verbundenen Gmail-Konten.
const { getSession, listAccounts } = require('./_lib/store');
const { clientForAccount, google, configured } = require('./_lib/google');
const { json } = require('./_lib/http');

function parseFrom(s) {
  if (!s) return { name: '', email: '' };
  const m = s.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>/);
  if (m) return { name: (m[1] || '').trim() || m[2], email: m[2] };
  return { name: s.trim(), email: s.trim() };
}
function importance(labels) {
  labels = labels || [];
  if (labels.indexOf('IMPORTANT') >= 0) return 'hoch';
  if (labels.indexOf('UNREAD') >= 0) return 'mittel';
  return 'niedrig';
}

module.exports = async function (req, res) {
  const sid = getSession(req, res);
  const m = await listAccounts(sid);
  const emails = Object.keys(m);
  if (!configured() || emails.length === 0) {
    return json(res, { configured: configured(), accounts: emails.length, items: [] });
  }

  const items = [];
  const errors = [];
  for (let k = 0; k < emails.length; k++) {
    const acc = emails[k];
    try {
      const auth = clientForAccount(req, m[acc].refresh_token);
      const gmail = google.gmail({ version: 'v1', auth: auth });
      const list = await gmail.users.messages.list({ userId: 'me', maxResults: 8, q: 'in:inbox' });
      const msgs = list.data.messages || [];
      for (let j = 0; j < msgs.length; j++) {
        const full = await gmail.users.messages.get({
          userId: 'me', id: msgs[j].id, format: 'metadata',
          metadataHeaders: ['From', 'Subject', 'Date']
        });
        const headers = {};
        ((full.data.payload && full.data.payload.headers) || []).forEach(function (x) { headers[x.name] = x.value; });
        const fr = parseFrom(headers.From);
        const labels = full.data.labelIds || [];
        items.push({
          id: msgs[j].id,
          threadId: full.data.threadId,
          account: acc,
          src: 'mail',
          name: fr.name,
          who: fr.email,
          sub: headers.Subject || '(kein Betreff)',
          preview: full.data.snippet || '',
          date: Number(full.data.internalDate || 0),
          imp: importance(labels),
          unread: labels.indexOf('UNREAD') >= 0
        });
      }
    } catch (e) {
      errors.push(acc + ': ' + ((e && e.message) || 'fehler'));
    }
  }
  items.sort(function (a, b) { return (b.date || 0) - (a.date || 0); });
  json(res, { configured: true, accounts: emails.length, items: items, errors: errors });
};
