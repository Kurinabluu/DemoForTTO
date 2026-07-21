# tto demo

这是 tto 项目的前端 Demo。

## 运行配置

环境变量见 `.env.development`（本地）与 `.env.production`（gh-pages 构建）。

| 变量 | 本地开发 | gh-pages 构建 | 说明 |
| --- | --- | --- | --- |
| `VITE_USE_API` | `true` | `false` | 是否请求内容 API（`/api/tto/items` 等） |
| `VITE_USE_LOCAL_JSON_FALLBACK` | `false` | `true` | 生产构建下是否用 fallback JSON（需 `PROD`） |
| `VITE_API_BASE_URL` | `/api` | `/api` | API 前缀（登录/收藏等仍可能使用） |
| `VITE_APP_BASE` | `/DemoForTTO/` | `/DemoForTTO/` | gh-pages 子路径部署前缀 |

**本地开发**：内容只走后端 API；后端不可用时报错或超时提示，**不会**静默回退 JSON。

**gh-pages**：内容读 `src/data/fallback/*.json`，不请求内容 API。详见 [docs/temp-dev-features.md](docs/temp-dev-features.md)。

## 登录与收藏

- 登录态由后端 `HttpOnly Cookie` 维护，前端不再持久化 token。
- 其他打开的标签页会通过 `BroadcastChannel` 同步登录/退出状态。
- 未登录时的收藏只保存在 `localStorage`，这部分不包含 token 这类敏感信息。
- 登录后只迁移本地收藏到账号收藏，不会把账号收藏反向写回本地。
- 退出登录后会切回本地收藏视图，账号收藏仍留在服务端。
- 请求后端时会自动携带 Cookie，并在服务端完成会话校验与续期。
- 收藏页会根据当前收藏项自动补全特别活动、景点、餐厅、住宿等内容。

## 用户感知

- 登录更安全，token 不再暴露给前端脚本。
- 浏览器长时间不关时的会话也更可控。
- 密码传输后的存储方式更规范，账号被撞库的风险更低。
- 异常不会再把堆栈直接暴露给前端，出错时体验更稳定。
- 登录失败过多会被临时限制，减少暴力尝试。
- 前端和后端都补了 `lint`，后续改动更容易保持一致。

## 数据说明

- 维护内容：改 `src/data/data.json` → `npm run data:sync`（`dev` / `prebuild` 会自动执行）。
- 地点邮编目录：`src/data/tas-location-postcodes.json` 为唯一源；批量命令见 [docs/location-catalog.md](docs/location-catalog.md)。
- gh-pages 部署：推送 `main`/`master` 触发 [`.github/workflows/gh-pages.yml`](.github/workflows/gh-pages.yml)（`data:sync` → `build` → 发布 `dist`）。
- `src/data/split/freeinfo.json` 仍用于卡片样式与 `isGrid=false` 区块富数据合并。

## 文档索引

| 文档 | 内容 |
| --- | --- |
| [docs/location-catalog.md](docs/location-catalog.md) | 地点目录、`catalog:*` 命令、数据同步流程 |
| [docs/scroll-session.md](docs/scroll-session.md) | 路由与滚动位置恢复 |
| [docs/temp-dev-features.md](docs/temp-dev-features.md) | gh-pages JSON 兜底说明 |
| [docs/pre-launch-checklist.md](docs/pre-launch-checklist.md) | 上线前检查清单 |
| [docs/inquiry-data-spec.md](docs/inquiry-data-spec.md) | 咨询表单字段规范 |

完整索引见 [docs/README.md](docs/README.md)。
