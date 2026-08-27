# TTO SEO / GEO Audit

更新时间：2026-08-27

## 已做

- 免费信息、服务页、关于我们、隐私、条款、退款改为独立页面
- 一日游 / 多日游、服务页、详情页补了 `title` / `description`
- 演示站保持 `noindex, nofollow`
- `robots.txt`、`sitemap.xml`、`llms.txt`、`404.html` 已补齐到前端构建链
- `ContentDetailView`、`ServiceShowcase`、`TripsGrid`、`AboutView` 已补结构化数据
- 详情页和服务页补了更具体的图片 `alt`
- 主页 / 列表页补了站点级 `WebSite` JSON-LD
- 默认 `og-default.png` 已改为与 header 同源的 logo 图
- 后端补了基础安全头，并加了 HSTS / CSP 硬化
- 详情页 FAQ 与“需要行程协助”区域做了视觉收口

## 未做

- 正式域名上线后再去掉 `noindex`
- 正式域名上线后再提交 Search Console / Bing Webmaster
- 正式域名上线后再切换 `VITE_SITE_ORIGIN`、`TTO_PUBLIC_SITE_ORIGIN`
- `index.html`、`robots.txt`、`.env.production` 里的 GitHub Pages / `DemoForTTO` 临时值要换成正式域名
- `404.html` 目前还是 GitHub Pages 的静态回退思路，上 AWS 后要改成 CloudFront / S3 / Nginx 的 SPA 回退方案
- 后端条目级 sitemap 需要正式域名后再启用提交
- 后端 `TTO_PUBLIC_SITE_ORIGIN` 和 `TTO_CORS_ALLOWED_ORIGINS` / 管理端 Origin 还要切成正式域名
- `/info/:itemKey` 继续语义化到 `/spots/...` 这类路径
- 预渲染 / SSG 仍然后置

## 当前内容补强缺口

按 `src/data/data.json` 里免费信息三类条目，且把正文里明确的占位文本也算进去（例如 `待补充`、`待修改`、`描述1`、`文本1`、英文标题等），目前还没更新的有：

- 景点：7 / 335，范围大致是 `测试标题` 到 `King Solomons Cave`
- 餐厅：5 / 298，范围大致是 `Fork it Farm` 到 `Zambrero Moonah`
- 住宿：109 / 232，范围大致是 `Tullah Lakeside Lodge` 到 `The British Hotel`

合计：121 条未补强，其余属于可继续抛光但不算“没做”。

## 下一步建议

1. 先把免费信息三类继续补齐到可发布状态。
2. 等正式域名确定后，再切换 `origin`、提交 sitemap、处理 Search Console。
3. 路由、预渲染这类大改先不要碰，等内容稳定再做。
