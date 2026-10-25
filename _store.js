const { redis } = require('./_redis');

const KEY = 'bank:items';

// Each item: { id, name, access_token (encrypted) }
async function getItems() {
  const raw = await redis(['GET', KEY]);
  return raw ? JSON.parse(raw) : [];
}

async function saveItems(items) {
  await redis(['SET', KEY, JSON.stringify(items)]);
}

module.exports = { getItems, saveItems };
