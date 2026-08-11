# 03 定价与商业模型 — Matcha Filter

- 项目：`matcha-filter`
- 域名：`matchafilter.online`
- 阶段：`03-pricing`
- 日期：2026-08-11
- 状态：`DONE`（Owner：开通 Creem 积分包 + 可选 AI Restore；本地工具仍免费）
- 上游：`docs/02-prd.md` · `docs/billing-creem.md`

## Owner 决议（2026-08-11）

- 本地 Apply/Remove **继续免费**
- 付费形态：**Creem 一次性积分包**（非强制 Google 登录）
- AI Restore：**先付费再跑**；失败退积分；不送免费真 AI

## 套餐

| 档 | 价格 | 包含 |
|---|---|---|
| Free | $0 | 本地 Apply + Remove |
| Starter | $3.99 | 5 AI credits |
| Plus | $9.99 | 20 AI credits |
| Pro | $24.99 | 60 AI credits |

1 credit = 1 AI image restore（见 `/pricing`）。

## 转化路径

1. SEO → `/remove` → 免费本地处理 → 不满意 → AI Restore / Buy credits  
2. `/pricing` → Creem checkout → `/billing/success` → 回 Remover

## 退款

见 `/refund`。
