// GET /api/calendar — kommende Termine ALLER verbundenen Google-Kalender.
const { getSession, listAccounts } = require('./_lib/store');
const { clientForAccount, google, configured } = require('./_lib/google');
const { json } = require('./_lib/http');

module.exports = async function (req, res) {
  const sid = getSession(req, res);
  const m = await listAccounts(sid);
  const emails = Object.keys(m);
  if (!configured() || emails.length === 0) {
    return json(res, { configured: configured(), items: [] });
  }

  const items = [];
  const errors = [];
  const now = new Date().toISOString();
  for (let k = 0; k < emails.length; k++) {
    const acc = emails[k];
    try {
      const auth = clientForAccount(req, m[acc].refresh_token);
      const cal = google.calendar({ version: 'v3', auth: auth });
      const r = await cal.events.list({
        calendarId: 'primary', timeMin: now, maxResults: 6,
        singleEvents: true, orderBy: 'startTime'
      });
      (r.data.items || []).forEach(function (ev) {
        const start = ev.start && (ev.start.dateTime || ev.start.date);
        items.push({
          id: ev.id,
          account: acc,
          src: 'kalender',
          name: 'Google Kalender',
          who: ev.location || acc,
          sub: ev.summary || '(ohne Titel)',
          preview: ev.description || ev.location || '',
          date: start ? new Date(start).getTime() : 0,
          start: start || null,
          imp: 'mittel',
          unread: false
        });
      });
    } catch (e) {
      errors.push(acc + ': ' + ((e && e.message) || 'fehler'));
    }
  }
  items.sort(function (a, b) { return (a.date || 0) - (b.date || 0); });
  json(res, { configured: true, items: items, errors: errors });
};
