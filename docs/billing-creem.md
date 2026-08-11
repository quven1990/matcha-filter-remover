# Creem billing + AI credits

## Why Creem
Merchant-of-record checkout for one-time credit packs. No Google login required — credits bind to a browser `wallet_id` in `localStorage`.

## Products to create in Creem (one-time)
| Pack | Credits | Suggested price | Env secret |
|---|---:|---:|---|
| Starter | 5 | $3.99 | `CREEM_PRODUCT_STARTER` |
| Plus | 20 | $9.99 | `CREEM_PRODUCT_PLUS` |
| Pro | 60 | $24.99 | `CREEM_PRODUCT_PRO` |

## Cloudflare Pages secrets
```bash
npx wrangler pages secret put CREEM_API_KEY --project-name matcha-filter
npx wrangler pages secret put CREEM_WEBHOOK_SECRET --project-name matcha-filter
npx wrangler pages secret put CREEM_PRODUCT_STARTER --project-name matcha-filter
npx wrangler pages secret put CREEM_PRODUCT_PLUS --project-name matcha-filter
npx wrangler pages secret put CREEM_PRODUCT_PRO --project-name matcha-filter
npx wrangler pages secret put FAL_KEY --project-name matcha-filter
# optional
npx wrangler pages secret put CREEM_API_BASE --project-name matcha-filter   # https://api.creem.io for live
npx wrangler pages secret put SITE_URL --project-name matcha-filter         # https://matchafilter.online
```

Test mode uses `https://test-api.creem.io` by default when `CREEM_API_BASE` is unset.

## Webhook
Creem Developers → Webhook URL:

`https://matchafilter.online/api/billing/webhook`

Events: at least `checkout.completed`.

## D1 migration
```bash
npx wrangler d1 migrations apply matcha-filter-samples --remote
```

## Flow
1. `/pricing` → POST `/api/billing/checkout` → Creem hosted checkout
2. Webhook grants credits to `metadata.wallet_id`
3. `/billing/success` confirms balance
4. `/remove` → **Run AI Restore** → POST `/api/ai/enhance` (1 credit; refund on failure)

Free WebGL Remove/Apply never requires credits.
