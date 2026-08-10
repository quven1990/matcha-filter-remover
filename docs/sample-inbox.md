# Voluntary sample inbox (D1)

Users can opt in on `/remove` or `/apply` to upload a compressed thumbnail/frame.

Guidance (compliant):
- Do not interrupt immediately after upload
- Do not block Save/Download — export always proceeds
- After a successful save, optionally show a light “share a sample?” tip (once per tab)
- Confirm uploads a compressed frame; dismiss skips and suppresses further prompts this session
- Never blocks the adjust UI; default processing stays on-device; no silent auto-upload

## Status

- D1 database: `matcha-filter-samples`
- Binding: `SAMPLES_DB`
- Table: `samples`

## Deploy

```bash
npx wrangler d1 migrations apply matcha-filter-samples --remote
npm run deploy
# or push to Git if Pages auto-deploys
```

## Review samples

List recent metadata:

```bash
npm run samples:list
```

Export one image by id (writes `./sample-<id>.jpg`):

```bash
npm run samples:get -- <id>
```

Or use Cloudflare Dashboard → Workers & Pages → D1 → `matcha-filter-samples`.
