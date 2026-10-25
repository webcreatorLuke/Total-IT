const crypto = require('crypto');
const { makeToken, MAX_AGE } = require('./_auth');
const { redis } = require('./_redis');

const MAX_TRIES = 5;
const WINDOW_SECONDS = 15 * 60;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  if (!process.env.ACCESS_PASSWORD || !process.env.SESSION_SECRET) {
    return res.status(500).json({ error: 'Server is not configured' });
  }

  try {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const key = `login:${ip}`;

    const tries = await redis(['INCR', key]);
    if (tries === 1) await redis(['EXPIRE', key, WINDOW_SECONDS]);
    if (tries > MAX_TRIES) {
      return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
    }

    const given = String((req.body && req.body.password) || '');
    const a = crypto.createHash('sha256').update(given).digest();
    const b = crypto.createHash('sha256').update(process.env.ACCESS_PASSWORD).digest();

    if (!crypto.timingSafeEqual(a, b)) {
      return res.status(401).json({ error: 'That code is not correct.' });
    }

    await redis(['DEL', key]);
    res.setHeader(
      'Set-Cookie',
      `session=${makeToken()}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`
    );
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('login error', e.message);
    res.status(500).json({ error: 'Server error' });
  }
};
