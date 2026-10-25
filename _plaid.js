const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const env = process.env.PLAID_ENV || 'sandbox';

const plaid = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
        'PLAID-SECRET': process.env.PLAID_SECRET,
      },
    },
  })
);

function plaidError(e) {
  return (e && e.response && e.response.data && e.response.data.error_code) || null;
}

module.exports = { plaid, plaidError };
