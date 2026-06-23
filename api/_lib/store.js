// Session-Cookie (signiert) + Konto-Speicher via Vercel KV (Upstash Redis).
// Ohne KV-Env-Variablen läuft alles weiter, aber Konten werden nicht persistiert.
const crypto = require('crypto');
const cookie = require('cookie');

const kvReady = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
let kv = null;
if (kvReady) {
  try { kv = require('@vercel/kv').kv; } catch (e) { kv = null; }
}

const SECRET = process.env.SESSION_SECRET || 'insecure-dev-secret-change-me';

function sign(v) {
  return v + '.' + crypto.createHmac('sha256', SECRET).update(v).digest('hex').slice(0, 40);
}
function unsign(s) {
  if (!s) return null;
  const i = s.lastIndexOf('.');
  if (i < 1) return null;
  const v = s.slice(0, i);
  return sign(v) === s ? v : null;
}

function getSession(req, res) {
  const c = cookie.parse(req.headers.cookie || '');
  let sid = unsign(c.op_sess);
  if (!sid) {
    sid = crypto.randomBytes(16).toString('hex');
    res.setHeader('Set-Cookie', cookie.serialize('op_sess', sign(sid), {
      httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 180
    }));
  }
  return sid;
}

async function listAccounts(sid) {
  if (!kv) return {};
  try { return (await kv.get('acct:' + sid)) || {}; } catch (e) { return {}; }
}
async function saveAccount(sid, email, data) {
  if (!kv) return;
  const m = (await kv.get('acct:' + sid)) || {};
  m[email] = Object.assign({}, m[email] || {}, data);
  await kv.set('acct:' + sid, m);
}
async function removeAccount(sid, email) {
  if (!kv) return;
  const m = (await kv.get('acct:' + sid)) || {};
  delete m[email];
  await kv.set('acct:' + sid, m);
}
function storageReady() { return !!kv; }

module.exports = { getSession, listAccounts, saveAccount, removeAccount, storageReady };
