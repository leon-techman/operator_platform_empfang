// POST /api/reply — erstellt einen Gmail-ENTWURF (kein automatischer Versand!).
// Body: { account, to, subject, text, threadId? }
const { getSession, listAccounts } = require('./_lib/store');
const { clientForAccount, google, configured } = require('./_lib/google');
const { json, readBody } = require('./_lib/http');

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function encodeSubject(s) {
  // MIME-Encode für Umlaute/Sonderzeichen
  return '=?UTF-8?B?' + Buffer.from(s, 'utf-8').toString('base64') + '?=';
}

module.exports = async function (req, res) {
  if (req.method !== 'POST') return json(res, { error: 'POST required' }, 405);
  const sid = getSession(req, res);
  if (!configured()) return json(res, { error: 'not_configured' }, 503);

  const body = await readBody(req);
  const account = body.account, to = body.to, text = body.text;
  const subject = body.subject || 'Antwort';
  const threadId = body.threadId || undefined;
  if (!account || !to || !text) return json(res, { error: 'missing_fields' }, 400);

  const m = await listAccounts(sid);
  if (!m[account]) return json(res, { error: 'unknown_account' }, 404);

  try {
    const auth = clientForAccount(req, m[account].refresh_token);
    const gmail = google.gmail({ version: 'v1', auth: auth });
    const mime =
      'To: ' + to + '\r\n' +
      'From: ' + account + '\r\n' +
      'Subject: ' + encodeSubject(subject) + '\r\n' +
      'Content-Type: text/plain; charset=UTF-8\r\n' +
      'MIME-Version: 1.0\r\n\r\n' +
      text;
    const draft = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: { message: { raw: b64url(mime), threadId: threadId } }
    });
    json(res, { ok: true, draftId: draft.data.id });
  } catch (e) {
    json(res, { error: (e && e.message) || 'draft_failed' }, 500);
  }
};
