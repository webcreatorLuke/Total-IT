const { requireAuth } = require('./_auth');
const { plaid, plaidError } = require('./_plaid');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  if (!requireAuth(req, res)) return;

  try {
    const request = {
      user: { client_user_id: 'shared-household' },
      client_name: 'Combined Balance',
      products: (process.env.PLAID_PRODUCTS || 'transactions').split(',').map((s) => s.trim()),
      country_codes: ['US'],
      language: 'en',
    };
    if (process.env.PLAID_REDIRECT_URI) request.redirect_uri = process.env.PLAID_REDIRECT_URI;

    const r = await plaid.linkTokenCreate(request);
    res.status(200).json({ link_token: r.data.link_token });
  } catch (e) {
    console.error('create-link-token', plaidError(e) || e.message);
    res.status(500).json({ error: `Could not start bank connection (${plaidError(e) || 'error'})` });
  }
};
