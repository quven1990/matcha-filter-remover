# 03 定价与商业模型 — Matcha Filter

- 项目：`matcha-filter`
- 域名：`matchafilter.online`
- 阶段：`03-pricing`
- 日期：2026-08-09
- 状态：`DONE`（Owner 已拍板：v0 **不上 AI、不上支付**）
- 上游：`docs/02-prd.md`

## Owner 决议（2026-08-09）

- **不上 AI**（含生成式反推 / 服务端模型）
- **不上支付**（无 Stripe/credits/订阅）
- 后续看流量与 GSC 再议 Phase B

## 一句话结论

**v0：本地 Apply/Remove 全免费**（成本≈带宽/Pages）。AI / 付费整段冻结，不进实现范围。

## 成本结构（v0）

| 项 | 预估 | 说明 |
|---|---|---|
| Cloudflare Pages | ~$0 | 静态+本地计算 |
| Workers（分析/轻 API） | 免费额内 | `[待确认]` 用量 |
| 媒体存储 | $0 | v0 不上传 |
| AI API | $0 | v0 不做 |
| 支付手续费 | $0 | v0 不接 |

→ v0 **不能亏**的底线很容易满足。

## 竞品信号（公开页，非精确财务）

| 竞品 | 模式 | 观察 |
|---|---|---|
| sparkpix.ai remove | credits；宣称注册送 5；单次 remove 10 credits；packs from **$9.99 / 350 credits** | AI 反推，有付费墙 |
| matchafilter.app | 本地免费 | 减效果，无上传 |
| Fotor | 免费额度 + 订阅/credits | 品牌截流 |

## 推荐套餐

### Phase A — Launch（本周）

| 档 | 价格 | 包含 | 目的 |
|---|---|---|---|
| Free | $0 | 本地 Apply + Remove，合理频率不限* | 抢 SEO/病毒流量 |
| Pro | — | 不上 | — |

\*防滥用：客户端限并发/文件大小（如图 ≤20MB，视频 ≤30s），非付费墙。

### Phase B — AI Upsell（**冻结 / Owner 未批准**）

整段不做。保留文档备忘，**实现与文案均不出现付费/AI CTA**，直到 Owner 再开。

~~原草案：$9.99 credits 等~~ — 作废于本轮。

## 转化路径

1. SEO/TikTok → `/remove` 或 `/apply` → 免费本地导出  
2. 无 waitlist / 无付费引导 / 无 AI CTA（本轮冻结）

禁止表达：无限量 AI、保证还原原图、保证看清遮挡内容、以及任何付费 CTA。

## 退款

- v0 无付费 → 无需 Refund 页；Terms 写明 free tool即可。

## 给文案/设计

- 首页与 `/remove`：**不放定价表、不放 Coming soon AI**
- Footer：`Free · Private · On-device`
- `/pricing`：**不建**

## 学员决策卡

- [x] **v0 纯免费**（Owner 已确认）  
- [x] **不上 AI / 不上支付**  
- Phase B 以后再说  

## 交接

- 实现范围：仅本地免费 Apply + Remove  
- 不能假设：本轮有 AI 或支付  

[DONE]
