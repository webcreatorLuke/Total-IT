const { requireAuth } = require('./_auth');
const { plaid } = require('./_plaid');
const { decrypt } = require('./_crypto');
const { getItems, saveItems } = require('./_store');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  if (!requireAuth(req, res)) return;

  try {
    const { id } = req.body || {};
    const items = await getItems();
    const item = items.find((i) => i.id === id);
    if (!item) return res.status(404).json({ error: 'Not found' });

    try {
      await plaid.itemRemove({ access_token: decrypt(item.access_token) });
    } catch (e) {
      // Already removed on Plaid's side is fine; still delete it here.
    }

    await saveItems(items.filter((i) => i.id !== id));
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('disconnect', e.message);
    res.status(500).json({ error: 'Could not disconnect' });
  }
};
