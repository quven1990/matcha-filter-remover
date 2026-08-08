# 06 Design Source — Matcha Filter

- 日期：2026-08-09
- 状态：DONE（Owner 授权代选风格并落地）
- 上游：`docs/02-prd.md` ICP、`docs/05-seo-copy-freeze.md`

## Visual Style Rationale（3 选 1）

| 方案 | 气质 | 适合谁 | 结论 |
|---|---|---|---|
| A. Soft Matcha Atelier | 茶室、泡沫、慢生活 | 品牌站 | 太养生 |
| B. Dark Social Neon | 深色霓虹 | 夜刷 | 易撞 AI 模板 |
| C. Bright Utility Studio | 硬工具台 + Syne | 纯效率党 | 试过后气质拧（科技字 vs 抹茶） |
| **D. Soft Utility（最终）** | 柔和抹茶 + 清晰工具层级 | **主 ICP** | **选用** |

### 为什么是 D

- 保留工具站清晰度（大预览、分步控件、强 CTA）
- 字体回到 Fraunces + Manrope，品牌更像「抹茶」而不是 SaaS
- 色更自然、圆角更软，去掉硬边条 / 方标，减少「怪」感


## 设计系统 Token

```css
--matcha: #1f7a45;
--matcha-deep: #0d3d24;
--matcha-bright: #2f9b58;
--bg: #eef3ee;
--panel: #ffffff;
--ink: #0f1c14;
--muted: rgba(15, 28, 20, 0.68);
--line: rgba(15, 28, 20, 0.1);
--radius: 1.15rem;
```

- Display：`Syne`（当代工具感）
- UI：`Manrope`
- 动效：轻量 rise / hover；工具页对比线清晰，不做炫光

## 页面落位

- `/`：品牌英雄级 + 一句价值 + 双 CTA；下沉双路径入口
- `/remove` `/apply`：预览为主舞台；控件分步卡片；Before/After 标签明确
- Guide / legal：prose 干净可读

## 反 AI 味自检

- [x] 非 Inter / 非紫渐变
- [x] 首屏非三卡片墙
- [x] 有行业色（抹茶）但不套模板奶油衬线
- [x] 工具态优先于装饰
