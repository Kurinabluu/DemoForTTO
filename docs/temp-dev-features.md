# 临时功能：gh-pages 本地 JSON 内容兜底

## 功能说明

在 **gh-pages 静态部署**（无可用内容 API）时，前端直接使用打包进 bundle 的 fallback JSON 展示景点/行程列表，避免请求 `/api/tto/*` 导致 404。

**这不是「API 调用失败后的自动降级」**——开发环境 API 失败只会报错，不会读 JSON。

## 环境区分

| 环境 | 配置文件 | 行为 |
| --- | --- | --- |
| **本地开发** | `.env.development` | `VITE_USE_API=true`，`VITE_USE_LOCAL_JSON_FALLBACK=false` → 内容只走后端 API |
| **gh-pages 生产构建** | `.env.production` | `VITE_USE_API=false`，`VITE_USE_LOCAL_JSON_FALLBACK=true` → 内容读 fallback JSON |

判断逻辑（`src/utils/ttoApi.js`）：

- `isLocalJsonFallbackEnabled()` = `import.meta.env.PROD` **且** `VITE_USE_LOCAL_JSON_FALLBACK=true`
- `isApiEnabled()` = 未启用 fallback **且** `VITE_USE_API=true`

## 数据文件

- `src/data/fallback/freeinfo_fallback.json` — 自助游/自驾游免费参考信息
- `src/data/fallback/daytrip_fallback.json` — 一日游/多日游

由 `npm run data:sync` 末尾的 `scripts/sync-fallback.mjs` 从 `src/data/split/` 同步生成。条目数随 `data.json` 变化，**不要写死**在文档里。

可选维护脚本：`scripts/fix-towns.mjs`（从文本推断 town，独立运行，非主流程）。

## 工作原理

`src/utils/contentRepository.js` 中 `loadSectionBundle()`：

```text
isApiEnabled() === false  →  loadLocalFallbackBundle(sectionPath)
isApiEnabled() === true   →  fetchNavTree + fetchItemsBySubNavKey；失败 throw，不回退 JSON
```

触发 fallback 的**唯一条件**：gh-pages 生产构建下内容 API 被刻意关闭（见上表）。

以下情况**不会**触发 JSON 兜底：

- 开发环境后端未启动 / 网络错误
- API 返回空导航或空 items 列表（当前实现会 **throw**）

登录、收藏、咨询等接口在 `isApiEnabled() === false` 时同样不走远程内容 API；是否可用取决于 gh-pages 是否部署了可访问的后端（通常 gh-pages 仅演示静态内容）。

## 与正式环境的关系

后端数据库正式上线且 gh-pages 不再需要静态演示后，可删除此功能。删除前务必在**带后端的正式部署**上验证 API 模式。

### 删除步骤（概要）

1. 删除 `src/data/fallback/` 及 `.env.production` 中 `VITE_USE_LOCAL_JSON_FALLBACK`
2. 将 `.env.production` 的 `VITE_USE_API` 改为 `true`（或按正式部署策略配置）
3. 从 `contentRepository.js` 移除 `loadLocalFallbackData` / `loadLocalFallbackBundle` 及相关 import
4. 从 `ttoApi.js` 移除 `isLocalJsonFallbackEnabled()` 分支（或简化为始终走 API）
5. 删除本文档

## 相关文件

| 文件 | 说明 |
| --- | --- |
| `src/utils/contentRepository.js` | fallback 读取与 API 分支 |
| `src/utils/ttoApi.js` | `isApiEnabled` / `isLocalJsonFallbackEnabled` |
| `scripts/sync-fallback.mjs` | split → fallback 同步 |
| `.env.development` / `.env.production` | 环境开关 |
| [location-catalog.md](./location-catalog.md) | 内容数据与地点目录维护 |
| [README.md](../README.md) | 环境总览 |

---

**创建日期**：2026-06-18  
**最后修订**：2026-07-21
