# Voluntary sample inbox (D1)

Users can opt in on `/remove` or `/apply` to upload a compressed thumbnail/frame.

Guidance (compliant):
- Prompt appears right after upload, above Adjust — dismissible with Not now
- Hard-cast frames get stronger copy; still requires explicit checkbox
- Soft one-time re-ask after “Stronger remove” if they dismissed earlier
- Never blocks export; default processing stays on-device

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
