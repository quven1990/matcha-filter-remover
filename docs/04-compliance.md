# 04 合规与法律页合同 — Matcha Filter

- 项目：`matcha-filter`
- 域名：`matchafilter.online`
- 阶段：`04-compliance`
- 日期：2026-08-09
- 市场：US / English（主）
- 状态：`DONE`（非律师意见；支付/运营主体信息待填）
- 上游：`docs/02-prd.md`、`docs/03-pricing.md`

> 本文是产品合规合同与禁用表达清单，**不是法律意见**。上线前运营主体/联系邮箱需学员确认。

## 一句话结论

v0 本地处理降低隐私风险；**P0 是 NSFW/虚假还原声明**。必须有 Privacy、Terms、Cookie；文案禁用「uncover / reveal NSFW / see through filter」。

## 数据处理地图（v0）

| 数据 | 是否收集 | 存哪 | 目的 |
|---|---|---|---|
| 用户上传媒体 | 默认否（本地处理） | 设备内存 | 滤镜处理 |
| 导出文件 | 否（用户本地下载） | — | — |
| 分析事件 | 是（若启用 GA4） | Google | 产品改进 |
| Cookie | 必要 + 分析（需同意条） | 浏览器 | 会话/分析 |
| 账号/支付 | v0 否 | — | — |
| 邮箱 waitlist | 否（本轮不做） | — | — |

若 v1 上传 AI：须单独同意、最短保留期、处理后删除说明。

## 第三方（v0 预期）

- Cloudflare（托管）
- Google Analytics 4（可选）
- Microsoft Clarity（可选）
- 支付/AI：无（v0）

## 法律页合同

| 页 | 路径 | 必须覆盖 |
|---|---|---|
| Privacy Policy | `/privacy` | 收集什么、不上传媒体（v0）、分析、保留、联系方式、儿童、国际传输 |
| Terms of Use | `/terms` | 服务描述、年龄、禁止滥用（含非法/非自愿 intimate 内容处理）、免责（结果非原件恢复）、IP、免责声明、终止 |
| Cookie | `/cookie` | 类别、同意、如何关闭 |
| Refund | `/refund` 或 Terms 一节 | v0 可写「No paid plans yet」；有支付后再拆页 |

运营主体占位：`[LEGAL_ENTITY_NAME]`、`[CONTACT_EMAIL]` → 学员补齐前页脚写通用 contact@matchafilter.online `[待确认]`。

## 禁用表达（Copy Freeze 必读）

### 禁止

- uncover / reveal / see through / unblur NSFW / restore censored body
- 100% original recovery / pixel-perfect restore of destroyed detail
- Official TikTok filter / endorsed by TikTok
- unlimited AI（若无成本模型）
- guaranteed identity recovery for third-party videos without rights

### 允许（诚实）

- reduce green cast / grain / harsh contrast
- on-device / private processing（v0）
- best-effort；cannot recreate missing pixels
- not affiliated with TikTok

## 功能红线

1. 工具默认不做「generative fill to invent hidden anatomy」类卖点  
2. 指南页可解释趋势存在 NSFW 滥用现象，但**不提供规避审核教程**  
3. DMCA/版权：用户仅处理有权编辑的媒体；Terms 写清  

## Compliance GO 检查（上线前）

- [ ] Privacy / Terms / Cookie 上线且 footer 可点
- [ ] 工具页 FAQ 含「cannot reveal hidden/censored content」
- [ ] 无禁用表达
- [ ] Cookie 同意条（若用非必要 cookie）
- [ ] 联系邮箱真实
- [ ] 若启用分析：披露在 Privacy

## 给文案/设计/前端

- Footer：Privacy · Terms · Cookie  
- `/remove` FAQ 至少 3 条含边界说明  
- 设计勿用「侦探偷看」「揭开遮罩」类插画隐喻  

## 风险

- P0：趋势 NSFW 联想 → 品牌安全与应用商店/广告政策风险  
- P1：用户上传他人 intimate 内容 → Terms 禁止 + 免责  
- P2：主体信息未填 → 页脚占位  

## 交接

- 下一阶段：05 SEO-Copy Freeze（必须遵守禁用表）  
- 不能假设：已律师审阅  

[DONE]
