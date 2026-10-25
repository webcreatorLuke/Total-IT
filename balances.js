const { requireAuth } = require('./_auth');
const { plaid, plaidError } = require('./_plaid');
const { decrypt } = require('./_crypto');
const { getItems } = require('./_store');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).end();
  if (!requireAuth(req, res)) return;

  try {
    const items = await getItems();

    const institutions = await Promise.all(
      items.map(async (item) => {
        try {
          const r = await plaid.accountsBalanceGet({ access_token: decrypt(item.access_token) });
          const accounts = r.data.accounts.map((a) => ({
            id: a.account_id,
            name: a.name,
            mask: a.mask,
            type: a.type,
            subtype: a.subtype,
            current: a.balances.current,
            available: a.balances.available,
          }));
          return { id: item.id, name: item.name, accounts };
        } catch (e) {
          return { id: item.id, name: item.name, accounts: [], error: plaidError(e) || 'UNKNOWN' };
        }
      })
    );

    // Cash + investments count as money you have.
    // Credit cards and loans count as money you owe (subtracted).
    let assets = 0;
    let owed = 0;
    for (const inst of institutions) {
      for (const a of inst.accounts) {
        const amount = a.current || 0;
        if (a.type === 'depository' || a.type === 'investment') assets += amount;
        else if (a.type === 'credit' || a.type === 'loan') owed += amount;
      }
    }

    res.status(200).json({
      institutions,
      totals: { assets, owed, net: assets - owed },
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('balances', e.message);
    res.status(500).json({ error: 'Could not load balances' });
  }
};
