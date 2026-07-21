# 地点邮编目录与内容数据维护

## 数据源分工

| 文件 | 用途 |
|------|------|
| `src/data/data.json` | 业务内容唯一源（景点/餐厅/住宿字段、town、postcode、belongsToSpot 等） |
| `src/data/tas-location-postcodes.json` | 地点邮编目录唯一源（town + postcode + nameZh） |
| `src/data/fallback/*.json` | gh-pages 打包用的 JSON 兜底（由脚本从 split 产物同步） |

前端 `tasLocationPostcodes.js` 直接 import 目录 JSON；后端通过 `catalog:sync-backend` 复制同一份文件。

## 环境差异（API vs JSON 兜底）

| 环境 | 配置 | 行为 |
|------|------|------|
| **本地开发** | `.env.development`：`VITE_USE_API=true`，`VITE_USE_LOCAL_JSON_FALLBACK=false` | 内容只走后端 API；后端不可用时报错，**不**静默回退 JSON |
| **gh-pages** | `.env.production`：`VITE_USE_API=false`，`VITE_USE_LOCAL_JSON_FALLBACK=true` | 不请求 `/api/tto/*`，使用 `src/data/fallback/` 内 JSON |

判断逻辑见 `src/utils/ttoApi.js`（`isApiEnabled` / `isLocalJsonFallbackEnabled`）与 `src/utils/contentRepository.js`。

## 日常：改内容后同步

```bash
```bash
# 从 data.json 拆分 → fix-scenic-locations → strip-location-labels → sync-fallback
npm run data:sync
```
```

`npm run dev` 与 `npm run build` 的 `prebuild` 已包含 `data:sync`，本地一般无需单独执行。

## 地点目录：批量维护命令

目录脚本：`scripts/location-catalog-admin.mjs`

### 扫描缺失条目

从 `data.json` 的景点/餐厅/住宿中找出「有 town + postcode 但不在目录里」的组合：

```bash
npm run catalog:scan
```

输出含可直接保存的 `batch.json` 模板（填好 `nameZh` 后用于批量导入）。

### 单条添加

```bash
npm run catalog:add -- Mangalore 7030 曼加洛尔
```

### 批量导入

```bash
# 预览
npm run catalog:import -- batch.json

# 写入目录
npm run catalog:import -- batch.json --apply
```

`batch.json` 格式：

```json
[
  { "town": "New Town", "postcode": "7008", "nameZh": "新镇" },
  { "town": "Gravelly Beach", "postcode": "7276", "nameZh": "格拉夫利海滩" }
]
```

### 同步到后端仓库

在 **tto-demo** 根目录执行（需同级存在 `tto-backend`）：

```bash
npm run catalog:sync-backend
```

将 `src/data/tas-location-postcodes.json` 复制到  
`tto-backend/src/main/resources/tto/tas-location-postcodes.json`。

后端重启后会加载新目录；已有内容行的 `postcode` / `location_label` 由迁移与 backfill 更新。

## 推荐工作流（模拟后台批量维护）

1. 在 `data.json` 维护 POI 的 `town`、`postcode`、`belongsToSpot`（业务数据不由脚本改写）。
2. `npm run catalog:scan` → 补全缺失目录 → `catalog:import --apply`。
3. `npm run catalog:sync-backend`（若后端也需要新目录）。
4. `npm run data:sync`（更新 split 与 gh-pages fallback）。
5. 本地验证 API 模式；构建验证 gh-pages fallback。

## GitHub Actions

推送 `main` / `master` 时，`.github/workflows/gh-pages.yml` 会：

1. `npm ci`
2. `npm run data:sync`（更新 fallback，供 gh-pages 打包）
3. `npm run catalog:scan`（仅报告缺失目录，不阻断部署）
4. `npm run build`（`prebuild` 会再次 `data:sync` + 缩略图）
5. 将 `dist/` 部署到 `gh-pages` 分支

手动触发：GitHub → Actions → **Deploy gh-pages** → Run workflow。
