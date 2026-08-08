# 02 产品定义与 PRD — Matcha Filter

- 项目：`matcha-filter`
- 域名：`https://matchafilter.online`
- 阶段：`02-product`
- 日期：2026-08-09
- 市场：US / English
- 状态：`DONE`（Owner：v0 不上 AI、不上支付）
- 上游：`docs/01-keyword-research.md` + 会话 SERP/竞品证据

---

## 1. 结论一句话

做 **品牌工具站 Matcha Filter**：首页承接趋势品牌词，**主转化/主 SEO 页做 Remove**（打 `matcha filter remover`），次要页做 Apply；v0 用**本地浏览器处理**，诚实边界，快速上线抢窗口。

---

## 2. 为什么这样定（相对域名）

| 选项 | 评价 |
|---|---|
| 只做 remover 单页站 | SEO 准，但域名 `matchafilter.online` 浪费品牌，趋势「上滤镜」流量接不住 |
| 只做 apply 滤镜站 | 和 Fotor/TikTok 硬刚，变现弱 |
| **Apply + Remove 品牌站（推荐）** | 域名匹配；主钱词仍打 remover；首页双 CTA 覆盖两端搜索 |

依据：关键词研究显示 remover 为 transactional 主线；`matcha filter` 混合意图适合品牌首页；竞品已出现本地减效果（matchafilter.app）与 AI 反推（sparkpix）两派。

---

## 3. ICP

| # | 用户 | 场景 | 是否主 ICP |
|---|---|---|---|
| A | 好奇看客 | 刷到抹茶绿视频，想看清人脸/场景 | **主 ICP**（搜索 remover） |
| B | 创作者 | 想自己做抹茶滤镜效果发帖，或不想用 TikTok 内置效果 | 次要（apply） |
| C | 丢原图的人 | 只剩抹茶风格图，想「变回」自然照片 | 次要（AI 反推，v1） |
| D | NSFW 窥探者 | 想看穿遮挡 | **拒绝服务 / NOT-DO** |

主 ICP 选择理由：痛点急、词带 remover、可工具化、付费意愿对标 credits 站存在（sparkpix）。

---

## 4. 定位（一句话）

**Matcha Filter is the private browser toolkit to apply or reduce the viral TikTok matcha green look — without uploading your media to strip hidden content.**

### 替代方案

- TikTok 内关掉滤镜（仅自己创作时）
- Fotor / Dreamina 通用去滤镜
- sparkpix AI 反推
- matchafilter.app 本地处理

### 差异化

1. 品牌域名直打趋势名
2. Apply + Remove 同一站完成
3. v0 本地处理 + 明确「不能完美还原 / 不能看穿遮挡」→ 信任与合规
4. 英文 US 市场、Cloudflare 快上

---

## 5. MVP / NOT-DO

### MVP（v0）

1. 首页：品牌 + 一句价值 + Apply / Remove 双 CTA
2. `/remove`：上传图或短视频 → 减绿/降噪/对比调整 → 预览对比 → 下载（本地处理）
3. `/apply`（或 `/filter`）：上传 → 加抹茶绿动态/色偏效果 → 导出
4. 趋势说明短页（合规口吻，不教 NSFW）
5. Privacy / Terms / Cookie 基础页
6. 基础 SEO：title/meta/H1/FAQ/schema、sitemap、robots、canonical
7. 分析：GA4 +（可选）Clarity

### NOT-DO（硬边界）

- ❌ 承诺「reveal / uncover / see through NSFW / restore censored body」
- ❌ 声称 100% 还原原片像素
- ❌ 冒充 TikTok / Meta 官方
- ❌ 采集用户媒体到服务器做默认路径（v0 默认本地；若 v1 上 AI 上传须明示同意）
- ❌ 抹茶茶具/食品电商
- ❌ 首屏堆 stats、多卡片仪表盘

### v1（冻结，Owner 未批准前不做）

- ~~AI「液体艺术 → 真人照片」credits~~ → **不上**
- ~~账户体系 + Stripe/Creem~~ → **不上**
- 后续看数据再议；本轮实现范围仅本地免费工具

---

## 6. 站点类型

**Tool / Hybrid**：交互工具为主，轻内容支撑 SEO。

Competitive minimum（要对标才能进 SERP 前排）：

1. 打开即可上传，无需写 prompt
2. 前后对比
3. 可下载结果
4. FAQ 覆盖「能不能完全还原 / 能不能看穿」
5. 移动端可用
6. 明确隐私（v0：媒体不离开设备）

---

## 7. 页面矩阵（SEO）

| URL | index | 主词 | H1 方向 | 主 CTA | Schema |
|---|---|---|---|---|---|
| `/` | yes | matcha filter | Brand + viral toolkit | Start Remove / Apply | WebSite, Organization |
| `/remove` | yes | **matcha filter remover** | Remove Matcha Filter | Upload & Remove | SoftwareApplication, FAQPage, HowTo |
| `/apply` | yes | matcha filter online / apply matcha filter | Apply Matcha Filter | Upload & Apply | SoftwareApplication, FAQPage |
| `/guide/what-is-matcha-filter` | yes | what is matcha filter | Explainer | Try Remove | Article, FAQPage |
| `/guide/how-to-remove-matcha-filter` | yes | how to remove matcha filter | How-to | Open Remover | HowTo, FAQPage |
| `/privacy` | noindex 或 yes（薄页） | — | Privacy | — | — |
| `/terms` | noindex 或 yes | — | Terms | — | — |
| `/cookie` | noindex | — | Cookie | — | — |

内链：首页 ↔ remove/apply；guide → remove；footer 合规页。

---

## 8. Route Contract（下游不可随意改路径）

```text
canonical_host: https://matchafilter.online
default_locale: en-US

GET /                         → Home (brand + dual CTA)
GET /remove                   → Remover tool (PRIMARY MONEY PAGE)
GET /apply                    → Apply tool
GET /guide/what-is-matcha-filter
GET /guide/how-to-remove-matcha-filter
GET /privacy
GET /terms
GET /cookie
GET /robots.txt
GET /sitemap.xml

# v0 无服务端媒体 API（本地处理）
# v1 预留（不要在 v0 实现除非确认支付）：
# POST /api/ai/remove   auth + credits
# POST /api/billing/*
```

别名（可选 301，不建双内容）：
- `/remover` → `/remove`
- `/filter` → `/apply`

---

## 9. 真实用户任务（P0 验收）

1. 用户打开 `/remove`，上传一张带绿滤镜的截图，30 秒内得到可下载的减绿结果，并看到 before/after。
2. 用户打开 `/apply`，上传普通自拍，得到可下载的抹茶风格结果。
3. 用户在 FAQ 看到「不能还原被遮挡内容」的明确说明，不产生虚假期望。
4. 移动端（375px）可完成上传与下载，无横向溢出。
5. 无控制台致命错误；媒体默认不上传服务器（v0）。

---

## 10. Data / 交互合同（v0）

| 能力 | 实现 | 数据落点 |
|---|---|---|
| Remove | Canvas / WebGL：色偏中和、降噪、对比 | 浏览器内存；导出 blob |
| Apply | Canvas / WebGL：绿偏、颗粒、可选轻微扭曲 | 同上 |
| 分析 | GA4 page_view + tool_start/tool_export 事件 | GA4 |
| 用户账号 | 无 | — |
| 媒体存储 | 无默认上传 | — |

`Data Contract` 文件名预留：`docs/08-data-contract.md`（实现阶段细化事件名与类型）。

---

## 11. visual_style_brief（给设计）

- 气质：清爽抹茶绿 + 奶油泡沫感，年轻社交工具，不是 SaaS 仪表盘
- 首屏：品牌名 **Matcha Filter** 为英雄级信号；一句价值；双 CTA；全幅氛围视觉（抹茶液体/绿雾），禁止首屏卡片墙
- 字体：有表达力的 display + 清晰正文（避免 Inter/Roboto/Arial 默认堆）
- 背景：渐变/纹理氛围，非纯色白板
- 工具区：上传区即主交互，不要卡片堆叠装饰
- 动效：2–3 个（例如液体微动、对比滑杆、CTA 微反馈）
- 规避：紫渐变模板风、奶油+赤陶报刊风、深色赛博光晕滥造

---

## 12. 商业化假设（已确认）

- v0：**纯免费**本地工具；**不上 AI、不上支付**（Owner 2026-08-09）
- 广告：病毒词期暂缓
- AI / credits / 订阅：整段冻结，看情况再开

---

## 13. 风险

| 级 | 风险 | 缓解 |
|---|---|---|
| P0 | NSFW 联想 / 滥用 | 文案禁 reveal；Terms；工具能力不「重建遮挡」 |
| P0 | 病毒词半衰期短 | same-week 上线；先本地工具 |
| P1 | Fotor/巨头截流 | 专词页更深 FAQ + 本地隐私卖点 |
| P1 | 双心智（AR vs AI art） | Remove 页只做减绿；不提 AI 反推（本轮无） |
| P2 | 量级未知 | 缺工具账号；先上线再看 Search Console |

---

## 14. 验收清单自检

- [x] 有 NOT-DO
- [x] 有首页 IA / 双 CTA
- [x] 有 SEO 页面矩阵
- [x] 有 Route Contract
- [x] 有 P0 用户任务
- [x] 有 visual_style_brief
- [x] 下游交接摘要（见下）

---

## 15. 下游交接摘要

### 当前结论
- 状态：DONE
- 一句话：品牌工具站，主推 `/remove` 打 matcha filter remover；v0 本地处理 + 合规诚实边界

### 本阶段交付物
- 本文件 `docs/02-prd.md`
- 控制板已更新方向决议

### 已确认
- 域名 `matchafilter.online`
- 主词与 BUILD_NOW
- Apply + Remove 结构
- **v0 不上 AI、不上支付**（Owner 2026-08-09）

### 待确认
- Cloudflare DNS
- 联系邮箱 / 法律主体名
- 关键词精确 volume（可选）

### 给下游
- 实现范围：本地免费工具 only
- 不能假设：本轮有服务端 AI 或支付

[DONE]
