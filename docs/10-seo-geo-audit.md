# 10 SEO / GEO / AEO 复核 — Matcha Filter

- 日期：2026-08-09
- 域名：`https://matchafilter.online`
- 范围：本地静态导出代码审计（生产未部署则线上验证 `[待确认]`）
- 状态：`NEEDS_REVIEW`（代码侧 P0 已修；GSC/Bing/生产 HTTPS 待 Owner）

## 一句话结论

技术 SEO 骨架基本可用；**sitemap 曾损坏（已修）**，GEO 缺定义块/实体 schema（已补）。上线后仍需 GSC/Bing 提交与 HTTPS 实测。

---

## 页面矩阵

| URL | 主词意图 | H1 | title/meta/canonical | Schema | Index | 备注 |
|---|---|---|---|---|---|---|
| `/` | brand / matcha filter | Matcha Filter | ✅ | Organization + WebSite | yes | H2 已对齐 freeze |
| `/remove` | **matcha filter remover** | Matcha Filter Remover | ✅ | SoftwareApplication + FAQ + HowTo | yes | Quick answer + 内链已补 |
| `/apply` | matcha filter / apply | Apply Matcha Filter | ✅ | SoftwareApplication + FAQ | yes | Quick answer 已补 |
| `/guide/what-is-matcha-filter` | what is matcha filter | What Is the Matcha Filter? | ✅ | Article + definition box | yes | |
| `/guide/how-to-remove-matcha-filter` | how to remove… | How to Remove… | ✅ | HowTo enriched | yes | |
| `/privacy` `/terms` `/cookie` | legal | ✅ | thin OK | no | yes | 低优先级 |

---

## 本轮已修（代码）

1. **P0** `sitemap.xml` 错误闭合标签（`</url></url>` → 正确 `</loc></url>`）
2. `robots.txt` 允许主流 AI crawler + sitemap
3. 新增 `public/llms.txt`（GEO 引用友好）
4. 根 layout：Organization/WebSite JSON-LD；去掉错误全局 canonical=`/`
5. `/remove` `/apply`：SoftwareApplication + FAQ；remove 加 HowTo；Quick answer 块
6. Guides：Article / 强化 HowTo；定义短答
7. 首页 H2 对齐 SEO copy freeze；补 how-to 内链

---

## 仍待 Owner / 上线后

| 项 | 状态 |
|---|---|
| 生产 HTTPS / 301 | `[待确认]` 未部署 |
| GSC 验证 + 提交 sitemap | `[BLOCKED: SETUP_REQUIRED]` |
| Bing Webmaster / IndexNow | 已接 IndexNow key 文件 + `npm run indexnow`（deploy 后自动提交 sitemap） |
| GA4 / Clarity | `[待确认]` |
| OG 分享图 `og:image` | P1 缺失 |
| Cloudflare Crawler Hints | 部署后开 |
| Ahrefs 审计 | `missing_ahrefs_access` |

---

## GEO / AEO 检查

| 信号 | 状态 |
|---|---|
| 清晰定义段（what is / remover） | ✅ |
| FAQ 可引用（含合规否定句） | ✅ |
| HowTo 步骤 | ✅ |
| 实体（Organization / SoftwareApplication） | ✅ |
| `llms.txt` | ✅ |
| 数据表 / 原创统计 | N/A（工具站） |
| 权威外链引用 | P1 冷启动后再做 |

---

## 质量门槛自检

- [x] sitemap 只含可索引真实页且 XML 合法
- [x] 核心页唯一 H1/title/meta/canonical
- [ ] GSC 状态真实 — 未接
- [ ] 生产 HTTP→HTTPS 301 — 未部署
- [x] 无占位薄内容进钱页

## 风险

- **P0（已修）**：坏 sitemap 会导致抓取失败
- **P1**：无 OG 图；未部署无法验证 indexability
- **P2**：法律页进 sitemap 略稀释，可接受

## 交接

- 下一阶段：部署 Cloudflare Pages → 验证 HTTPS → GSC/Bing 提交 `sitemap.xml` + `llms.txt`
- 必须读取：`docs/05-seo-copy-freeze.md`、本文件

[NEEDS_REVIEW]
