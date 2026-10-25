const crypto = require('crypto');

const MAX_AGE = 60 * 60 * 24 * 90; // 90 days, in seconds

function sign(value) {
  return crypto
    .createHmac('sha256', process.env.SESSION_SECRET)
    .update(value)
    .digest('hex');
}

function makeToken() {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  return `${exp}.${sign(exp)}`;
}

function isValid(req) {
  if (!process.env.SESSION_SECRET) return false;
  const match = (req.headers.cookie || '').match(/(?:^|; )session=([^;]+)/);
  if (!match) return false;
  const [exp, sig] = match[1].split('.');
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(exp));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Use at the top of every protected endpoint:  if (!requireAuth(req, res)) return;
function requireAuth(req, res) {
  if (isValid(req)) return true;
  res.status(401).json({ error: 'Not signed in' });
  return false;
}

module.exports = { makeToken, isValid, requireAuth, MAX_AGE };
