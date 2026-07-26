# TTO Demo

塔斯马尼亚旅游内容演示站前端。支持本地联调、GitHub Pages 云部署（连接 Render + Aiven）。

## 线上地址

| 环境 | URL |
| --- | --- |
| gh-pages 演示 | https://kurinabluu.github.io/DemoForTTO/ |
| 发布分支 | 推 `viewDemo` → Actions 构建 → 发布到 `vue-pages` |

## 快速开始

```bash
npm install
npm run dev          # 自动 data:sync + 启动 Vite（默认走 /api 代理）
npm run build        # 生产构建
npm run lint         # ESLint
```

本地需同时启动 `tto-backend`（默认 `http://127.0.0.1:8080`），Vite 会把 `/api` 代理到后端。

## 环境变量

| 变量 | 本地开发 | gh-pages 构建 | 说明 |
| --- | --- | --- | --- |
| `VITE_USE_API` | `true` | `true`（Actions 注入） | 是否请求内容 API |
| `VITE_USE_LOCAL_JSON_FALLBACK` | `false` | `false` | 关闭静态 JSON 兜底，走云 API |
| `VITE_API_BASE_URL` | `/api` | GitHub 变量 `TTO_API_BASE_URL` | 须为完整 URL 且含 `/api` |
| `VITE_APP_BASE` | `/DemoForTTO/` | `/DemoForTTO/` | gh-pages 子路径 |

GitHub 仓库 Settings → Variables：`TTO_API_BASE_URL=https://<render-host>.onrender.com/api`

## 登录与收藏（2026-07 云部署）

- gh-pages 与 Render 跨域：登录后 JWT 存 `localStorage`（`tto_auth_token`），请求头带 `token`；后端同时返回 `X-Auth-Token` 供续期。
- 多标签页通过 `BroadcastChannel` 同步登录态。
- 未登录收藏存本地；登录后可迁移到账号收藏。
- 收藏页需先 `bootstrapAuthSession` 再拉远程列表；列表加载失败且本地已有数据时不会清空。

## 数据维护（无后台时）

**唯一源文件**：`src/data/data.json`

改完后执行：

```bash
npm run data:sync
```

会拆分 `split/*.json`、更新 `fallback/`、搜索索引等。详细批量维护方法见 **[DATA-MAINTENANCE.md](./DATA-MAINTENANCE.md)**。

地点邮编目录：`src/data/tas-location-postcodes.json`，命令见 `npm run catalog:*`。

## 部署流程

1. 修改代码 / 数据并 commit
2. 推送到 `viewDemo`
3. [`.github/workflows/gh-pages.yml`](.github/workflows/gh-pages.yml) 自动：`data:sync` → 校验 `TTO_API_BASE_URL` → `build` → 发布 `dist` 到 `vue-pages`

## 文档索引

| 文档 | 内容 |
| --- | --- |
| [DATA-MAINTENANCE.md](./DATA-MAINTENANCE.md) | **JSON 批量改数据、同步、导入数据库** |
| [tto-backend/README.md](../tto-backend/README.md) | 后端启动、导入、云环境变量 |
| 本机 `docs/`（已 gitignore） | 可选本地扩展文档 |

## 近期功能要点（2026-07）

- gh-pages 全面切换云 API，不再依赖静态 fallback 读内容
- 全站搜索：结果页统一加载态，去掉搜索按钮双重等待
- 景点子搜索：清除关键字时显示加载中，避免误报「服务暂不可用」
- 收藏页导航与加载修复；网格区与子搜索均有 loading 反馈
