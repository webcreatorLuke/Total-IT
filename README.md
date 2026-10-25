# Combined Balance

Invite-only site that links bank accounts through Plaid and shows one combined total.
Cash and investments are added; credit cards and loans are subtracted.

Stack: static page (`public/`) + Vercel serverless functions (`api/`) + Upstash Redis for storage.

## Setup

1. Upload this whole folder to a new GitHub repo.
2. Create a Plaid account and copy your `client_id` and Sandbox secret (Plaid Dashboard -> Developers -> Keys).
3. In Vercel: Add New -> Project -> import the GitHub repo. Leave the framework as "Other".
4. In the Vercel project: Storage -> Marketplace -> Upstash Redis -> create a free database and connect it to the project.
5. In Project Settings -> Environment Variables, add everything listed in `.env.example`.
6. Redeploy. Open the site, enter your access code, and connect a Sandbox bank
   (search "Platypus", username `user_good`, password `pass_good`).
7. To use real banks: request Production access in Plaid, finish the OAuth registration for the banks you need,
   add your site URL as an allowed redirect URI, set `PLAID_REDIRECT_URI`, switch `PLAID_ENV` to `production`
   and use your Production secret.

## Notes

- Access tokens are encrypted (AES-256-GCM) before being stored.
- Changing `SESSION_SECRET` signs everyone out. Changing `ACCESS_PASSWORD` stops new sign-ins.
- Everyone with the code sees the same linked accounts.
