# Project Control Board — matcha-filter

## 1. 项目启动卡

- 项目：`matcha-filter`
- 域名：`matchafilter.online`（已注册）
- 目标市场：`US / English`
- 种子词：`matcha filter remover`, `remove matcha filter`, `matcha filter`
- 项目类型：`TOOL`（Apply + Remove）
- 商业化：`FREE`（不上 AI、不上支付）
- 技术栈：Next.js static export → Cloudflare Pages
- 状态：`RUNNING`
- Owner 授权：2026-08-09「开始吧」→ 已开做实现

## 2. 学员只需要处理

- [x] 域名已注册
- [x] v0 不上 AI / 不上支付
- [ ] DNS / Cloudflare 接入
- [ ] GitHub remote / 允许 push
- [ ] 确认生产部署到 `matchafilter.online`
- [ ] 联系邮箱是否用 `hello@matchafilter.online`

## 3. 流水线状态

| 阶段 | 状态 | 输出 |
|---|---|---|
| 01–05 文档 | DONE | `docs/01`–`05` |
| 06 design | DONE | `docs/06-design-source.md`（轻量） |
| 07 frontend | DONE（本地 build 通过） | `app/` + `out/` |
| 08 backend | SKIP v0 | 无服务端 |
| 09–12 | WAITING | 待预览确认 → 部署 |

## 4. 当前汇报

### done
- 站点代码已生成；`npm run build` 成功（11 个静态页）

### running
- 本地预览（`npm run dev`）

### waiting
- 你确认效果后，再绑 DNS / Pages 部署

## 本地验证

```bash
npm run dev
# http://localhost:3000
# /remove  /apply
```

## 需要你处理
1. 打开本地预览，试上传一张图看 Remove/Apply
2. 回「可以部署」并确认 Cloudflare DNS 是否已好
