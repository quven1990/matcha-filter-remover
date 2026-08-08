# 05 SEO-Copy Freeze — Matcha Filter

- 项目：`matcha-filter`
- 域名：`https://matchafilter.online`
- 阶段：`05-copy`
- 日期：2026-08-09
- 语言：English (US)
- 状态：`DONE` — 设计前冻结；改词须走变更记录
- 上游：`docs/02-prd.md`、`docs/03-pricing.md`、`docs/04-compliance.md`

**Freeze 规则：** title / meta / H1 / 主 CTA / FAQ 答案未经确认不得改义；尤其不得加入禁用表达（见合规）。

---

## Global

- Brand：`Matcha Filter`
- Tagline：`Apply or reduce the viral matcha look — privately in your browser.`
- Trust chips：`On-device` · `Free` · `No upload (v0)`
- Footer legal：Privacy · Terms · Cookie
- Nav：Remove · Apply · Guide

---

## `/` Home

**title:** Matcha Filter — Viral Matcha Look, Apply or Remove Online  
**meta:** Matcha Filter is a private browser toolkit to apply the viral matcha green effect or reduce it from photos and videos — free, on-device, no account.

**H1:** Matcha Filter  
**sub:** Apply the viral green look, or dial it back when you need a clearer frame — processed on your device.

**CTA primary:** Remove Matcha Filter → `/remove`  
**CTA secondary:** Apply Matcha Filter → `/apply`

**H2 sections (one job each):**
1. Two tools. One matcha trend.
2. Private by default — media stays in your browser.
3. Honest limits beat false “restore original” claims.

**Body notes:** Brand name is the hero signal; no stats strip; no card grid in first viewport.

---

## `/remove` (PRIMARY MONEY PAGE)

**title:** Matcha Filter Remover — Reduce the Green Effect Online  
**meta:** Free matcha filter remover for photos and short videos. Reduce green cast, grain, and harsh contrast on-device. Cannot reveal hidden or censored detail.

**H1:** Matcha Filter Remover  
**sub:** Upload a matcha-green clip or screenshot. We reduce the tint and grain so the frame is easier to read — best effort, on your device.

**CTA:** Upload & Remove  
**Secondary:** Compare before / after

**H2:**
1. How the remover works
2. What it can and cannot fix
3. Free, private, no account
4. FAQ

**Tool microcopy:**
- Drop zone：`Drop a photo or short video` / `JPG, PNG, WebP, MP4 · stays on your device`
- Buttons：`Remove effect` · `Download` · `Reset`
- Limit toast：`Keep clips short for smooth export`（具体秒数实现时填）

**FAQ (freeze answers):**

1. **What is a matcha filter remover?**  
   A tool that reduces the viral matcha green tint, grain, and harsh contrast on a saved photo or video so the frame is clearer.

2. **Can this restore the exact original TikTok file?**  
   No. Once an effect is baked into an export, missing detail cannot be recovered perfectly. This tool makes a best-effort cleanup of what is still visible.

3. **Can it reveal hidden or censored content behind the filter?**  
   No. It does not uncover masked, painted-over, or NSFW-obscured detail. It only adjusts visible pixels.

4. **Do you upload my media?**  
   No for the default on-device remover. Processing stays in your browser.

5. **Is Matcha Filter affiliated with TikTok?**  
   No. Independent tool. Not endorsed by TikTok.

**HowTo steps (schema):**
1. Open Matcha Filter Remover  
2. Upload your photo or short video  
3. Adjust strength if needed  
4. Download the cleaned result  

---

## `/apply`

**title:** Matcha Filter Online — Apply the Viral Green Effect  
**meta:** Apply a matcha-style green look to photos and videos in your browser. Free on-device matcha filter — no TikTok account required.

**H1:** Apply Matcha Filter  
**sub:** Turn an ordinary clip into the soft green, grainy matcha vibe — processed locally.

**CTA:** Upload & Apply  

**H2:**
1. Make the look without the app hop
2. Tune strength, grain, and motion
3. FAQ

**FAQ:**
1. **Is this the official TikTok matcha filter?** — No. Inspired look for drafts and posts you create yourself.  
2. **Does my video leave the device?** — Not for the default on-device apply tool.  
3. **Can I remove it later?** — Yes — use `/remove` for best-effort reduction.

---

## `/guide/what-is-matcha-filter`

**title:** What Is the Matcha Filter Trend? Explained  
**meta:** The matcha filter is a viral green-tinted look on short video. Learn what it is, why it spread, and how to apply or reduce it with Matcha Filter.

**H1:** What Is the Matcha Filter?  
**sub:** A heavy green aesthetic that took over short-form feeds — fun to make, tricky to read when overdone.

**Body outline:**
- What people mean by “matcha filter”
- Why creators use it (aesthetic + reveal edits)
- Note: some misuse exists; we don’t help evade platform rules
- CTA → Apply / Remove

**禁用：** 不写如何用滤镜规避审核或发布 intimate 内容的步骤。

---

## `/guide/how-to-remove-matcha-filter`

**title:** How to Remove a Matcha Filter from a Photo or Video  
**meta:** Step-by-step: reduce a matcha green filter online with Matcha Filter Remover. Free, on-device, honest about limits.

**H1:** How to Remove a Matcha Filter  
**steps:**
1. Save or screenshot the clip you have rights to edit  
2. Open `/remove`  
3. Upload and run Remove effect  
4. Compare and download  

**CTA：** Open Matcha Filter Remover  

---

## Legal page titles (thin)

- Privacy — `Privacy Policy | Matcha Filter`
- Terms — `Terms of Use | Matcha Filter`
- Cookie — `Cookie Policy | Matcha Filter`

---

## CTA lexicon (freeze)

| Use | Avoid |
|---|---|
| Remove effect | Uncover / Reveal secret |
| Reduce green cast | Restore 100% original |
| On-device / Private | Official TikTok tool |
| Best effort | Guaranteed identity recovery |

---

## Schema 清单

- Home：WebSite + Organization  
- `/remove` `/apply`：SoftwareApplication + FAQPage (+ HowTo on remove)  
- Guides：Article + FAQPage / HowTo  

---

## 验收

- [x] 主钱页 title 含 matcha filter remover 语义  
- [x] FAQ 含 cannot reveal / cannot perfect restore  
- [x] 无禁用表达  
- [x] 首页品牌为英雄级  
- [x] CTA 指向锁定路由  

## 交接

- 下一阶段：06 design source  
- 必须遵守本 Freeze + `docs/04-compliance.md` 禁用表  
- 路径不得改：`/remove` `/apply`

[DONE]
