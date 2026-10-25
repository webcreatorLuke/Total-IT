const { requireAuth } = require('./_auth');
const { plaid, plaidError } = require('./_plaid');
const { encrypt } = require('./_crypto');
const { getItems, saveItems } = require('./_store');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  if (!requireAuth(req, res)) return;

  try {
    const { public_token, institution_name } = req.body || {};
    if (!public_token) return res.status(400).json({ error: 'Missing public_token' });

    const r = await plaid.itemPublicTokenExchange({ public_token });
    const { access_token, item_id } = r.data;

    const items = (await getItems()).filter((i) => i.id !== item_id);
    items.push({
      id: item_id,
      name: institution_name || 'Bank',
      access_token: encrypt(access_token),
    });
    await saveItems(items);

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('exchange-token', plaidError(e) || e.message);
    res.status(500).json({ error: 'Could not save the bank connection' });
  }
};
