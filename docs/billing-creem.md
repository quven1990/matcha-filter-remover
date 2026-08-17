# Creem billing + AI credits

## Why Creem
Merchant-of-record checkout for one-time credit packs. No Google login required — credits bind to a browser `wallet_id` in `localStorage`.

## Products to create in Creem (one-time)
| Pack | Credits | Suggested price | Env secret |
|---|---:|---:|---|
| Trial | 2 | $1.99 | `CREEM_PRODUCT_TRIAL` |
| Starter | 5 | $3.99 | `CREEM_PRODUCT_STARTER` |
| Plus | 20 | $9.99 | `CREEM_PRODUCT_PLUS` |
| Pro | 60 | $24.99 | `CREEM_PRODUCT_PRO` |

## Cloudflare Pages secrets
```bash
npx wrangler pages secret put CREEM_API_KEY --project-name matcha-filter
npx wrangler pages secret put CREEM_WEBHOOK_SECRET --project-name matcha-filter
npx wrangler pages secret put CREEM_PRODUCT_TRIAL --project-name matcha-filter
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

Includes wallet safety columns (`status`, `safety_block_count`) from `0003_wallet_safety.sql`.

## Abandoned checkout reminder
This is a conservative, one-time service reminder for users who entered an email,
started a Creem checkout, and are still `pending` after 20-60 minutes. It is not a
newsletter or discount campaign.

Cloudflare setup:
```bash
npx wrangler pages secret put ABANDONED_EMAIL_SECRET --project-name matcha-filter
npx wrangler pages secret put ABANDONED_EMAIL_FROM --project-name matcha-filter # billing@matchafilter.online
npx wrangler pages secret put LEGAL_POSTAL_ADDRESS --project-name matcha-filter
```

Also enable Cloudflare Email Sending for the sender domain and bind it as `EMAIL`
before triggering the endpoint. If `EMAIL` or `LEGAL_POSTAL_ADDRESS` is missing,
the endpoint refuses to send.

Once `billing@matchafilter.online` is verified for Cloudflare Email Sending, add
the binding to `wrangler.jsonc`:
```json
"send_email": [
  {
    "name": "EMAIL",
    "allowed_sender_addresses": ["billing@matchafilter.online"]
  }
]
```

Trigger every 10 minutes from a private cron:
```bash
curl -X POST https://matchafilter.online/api/billing/abandoned-email \
  -H "x-abandoned-email-secret: $ABANDONED_EMAIL_SECRET"
```

## Flow
1. `/pricing` → tap Buy (implies 18+ / Terms) → POST `/api/billing/checkout` → Creem hosted checkout
2. Webhook grants credits to `metadata.wallet_id`
3. `/billing/success` confirms balance
4. `/remove` → confirm policy → **Run AI Restore** → POST `/api/ai/enhance` (1 credit; refund on failure)

Free WebGL Remove/Apply never requires credits.

## Refund ops checklist
When `billing@` gets a refund request:

1. Ask for Creem order / receipt id + approximate purchase time.
2. Look up the order:
   ```bash
   npx wrangler d1 execute matcha-filter-samples --remote --command \
     "SELECT id, wallet_id, pack, credits, status, creem_order_id, email, created_at FROM orders WHERE creem_order_id = 'ORDER_ID' OR id = 'ORDER_ID' LIMIT 5"
   ```
3. Check whether that wallet started any AI job:
   ```bash
   npx wrangler d1 execute matcha-filter-samples --remote --command \
     "SELECT reason, delta, ref_id, created_at FROM credit_ledger WHERE wallet_id = 'WALLET_ID' AND reason LIKE 'ai_%' ORDER BY created_at DESC LIMIT 20"
   ```
4. Decision:
   - Duplicate / processor error → refund via Creem.
   - Within 7 days **and** no `ai_enhance_image` / AI spend rows → unused pack cash refund OK.
   - Any successful AI delivery (or any AI job started after purchase per policy) → **deny cash refund**; point to `/refund`.
   - Safety / failed job already auto-returned credit → not a card refund.

## Abuse / chargeback SOP
- Inbox: `abuse@matchafilter.online` (policy) / `billing@` (chargebacks).
- **Do not** ask reporters to email CSAM image files; collect order id / wallet id / time only.
- Suspend wallet immediately on credible abuse or chargeback:
  ```bash
  npx wrangler d1 execute matcha-filter-samples --remote --command \
    "UPDATE wallets SET status = 'suspended', updated_at = datetime('now') WHERE id = 'WALLET_ID'"
  ```
- Suspended wallets cannot checkout or run AI (`wallet_suspended`).
- Auto-suspend: after **3** `content_blocked` safety events (`safety_block_count`).
- Restore only after review:
  ```bash
  npx wrangler d1 execute matcha-filter-samples --remote --command \
    "UPDATE wallets SET status = 'active', updated_at = datetime('now') WHERE id = 'WALLET_ID'"
  ```
- Report apparent CSAM through provider / required channels; do not keep or forward illegal images in chat.
