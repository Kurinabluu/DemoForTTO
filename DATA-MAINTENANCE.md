# TTO 内容数据维护指南（无后台管理系统）

适用：`src/data/data.json` 及关联 split / fallback / 云数据库。

## 1. 黄金规则

1. **只改源文件**：日常编辑 `src/data/data.json`（不要直接改 `split/` 或 `fallback/`，它们由脚本生成）。
2. **改完必同步**：`npm run data:sync`（`dev` / `prebuild` / CI 也会自动跑）。
3. **改完必提交**：未提交的 `data.json` 不要用 `git restore` 覆盖；清理仓库前先 `git add` / commit。
4. **稳定主键**：每条景点尽量保留 `itemKey`（如 `trips/freeinfo:景点:crater-lake-lookout`），后端导入靠它 upsert，改标题不会变新记录。
5. **要上云数据库**：前端 commit 后，在 `tto-backend` 用导入任务把最新 `data.json` 灌进 Aiven（见下文 §6）。

## 2. 一条命令搞定的同步链

```bash
npm run data:sync
```

等价于：

| 步骤 | 脚本 | 作用 |
| --- | --- | --- |
| 1 | `split-data.mjs` | `data.json` → `split/freeinfo.json`、`daytrip.json`、`nav.json`、`search-index.json` 等 |
| 2 | `fix-scenic-locations.mjs` | 修正景点地点相关字段 |
| 3 | `strip-location-labels.mjs` | 规范化 locationLabel |
| 4 | `sync-fallback.mjs` | split → `fallback/`（离线兜底快照，云模式可不依赖） |

## 3. 已有批量工具（推荐优先用）

### 3.1 地点 / 邮编目录

数据源：`src/data/tas-location-postcodes.json`

```bash
# 扫描 data.json 里有哪些 town+postcode 还没进目录
npm run catalog:scan

# 单条添加
npm run catalog:add -- Mangalore 7030 曼加洛尔

# 批量 JSON 导入（先预览，加 --apply 才写入）
node scripts/location-catalog-admin.mjs import batch-towns.json
node scripts/location-catalog-admin.mjs import batch-towns.json --apply

# 同步到 tto-backend 资源目录
npm run catalog:sync-backend
```

`batch-towns.json` 格式：

```json
[
  { "town": "Queenstown", "postcode": "7467", "nameZh": "昆斯敦" }
]
```

### 3.2 按规则批量补 town / postcode

`scripts/fix-towns.mjs` 会结合 `tas-location-postcodes.json` 从 route、desc 等字段推断并写回 `freeinfo.json`（需在 split 之后、或由 `data:split` 链路间接使用）。大规模补全历史曾用此脚本 + 手工校对。

### 3.3 缩略图

新增图片后：

```bash
npm run images:thumb
```

## 4. 无后台时的便捷批量改法

### 方案 A：Cursor / VS Code 多光标 + 正则（适合 5～20 条）

1. 在 `data.json` 里搜 `"itemKey": "trips/freeinfo:景点:xxx"` 或英文 `enTitle`。
2. 用多光标同时改 `title`、`desc`、`features`、`tags`。
3. `npm run data:sync` → 本地 `npm run dev` 预览 → commit。

### 方案 B：Excel / 表格 → JSON 批量（适合几十条结构相同）

1. 把要改的字段导出成 CSV（列：`itemKey, title, desc, route, town, postcode`）。
2. 用下面 Node 一次性合并（保存为 `scripts/patch-items.mjs`，**不要提交含私密数据的 CSV**）：

```javascript
import fs from 'node:fs'

const data = JSON.parse(fs.readFileSync('src/data/data.json', 'utf8'))
const patches = JSON.parse(fs.readFileSync('patches.json', 'utf8')) // [{ itemKey, title, desc, ... }]

const patchMap = new Map(patches.map((p) => [p.itemKey, p]))
const section = data.find((r) => r.tagName === '自助游/自驾游免费参考信息')

section?.subNav?.forEach((sub) => {
  sub.items?.forEach((item) => {
    const p = patchMap.get(item.itemKey)
    if (!p) return
    if (p.title) item.title = p.title
    if (p.enTitle) item.enTitle = p.enTitle
    Object.assign(item.tripData || (item.tripData = {}), {
      ...(p.desc && { desc: p.desc }),
      ...(p.route && { route: p.route }),
      ...(p.town && { town: p.town }),
      ...(p.postcode && { postcode: p.postcode }),
    })
  })
})

fs.writeFileSync('src/data/data.json', `${JSON.stringify(data, null, 4)}\n`)
console.log('patched', patches.length, 'items')
```

3. `node scripts/patch-items.mjs && npm run data:sync`

### 方案 C：按 itemKey 用 jq（命令行熟练时）

```bash
# 示例：仅查看某条
jq '.. | objects | select(.itemKey=="trips/freeinfo:景点:empire-art-box")' src/data/data.json
```

复杂嵌套建议仍用方案 B 的小脚本，比纯 jq 不易出错。

### 方案 D：让 AI 辅助（适合长文案）

1. 提供 `itemKey` 列表 + 维基 / 官网资料。
2. 生成 patches.json，走方案 B 合并。
3. **人工抽查** route、postcode、图片路径后再 commit。

## 5. 新增一条景点检查清单

- [ ] `itemKey` 唯一且语义稳定（kebab-case）
- [ ] `title` / `enTitle` / `tripData.route` / `desc` / `features` / `tags`
- [ ] `town` + `postcode`（用于邮编筛选）
- [ ] 图片路径 `../assets/img/places/...` 文件存在
- [ ] `npm run data:sync` 无报错
- [ ] 本地或 gh-pages 搜索能命中

## 6. 同步到云数据库（Render + Aiven）

1. `tto-demo`：`npm run data:sync` 并 commit `data.json`
2. `tto-backend` 设置环境变量（见 `private-docs/cloud-config.md`，勿提交密钥）：

```powershell
$env:TTO_IMPORT_SOURCE_PATH = "V:/WebForZanChen/tto-demo/src/data/data.json"
$env:TTO_IMPORT_ENABLED = "true"
$env:TTO_IMPORT_CLEAR_BEFORE_IMPORT = "false"
```

3. 用 `import` profile 或临时启用导入启动一次后端，完成后 **`TTO_IMPORT_ENABLED=false`**
4. 验证：`SELECT COUNT(*) FROM tto_content_item;`，前端 gh-pages 刷新

测试连通性可执行 `tto-backend/sql/tto_hobart7000_test_data.sql` 插入单条测试记录。

## 7. 常见错误

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 改了 data.json 线上没变 | 未 push / Actions 未跑完 | 推 `viewDemo`，看 Actions |
| 改了 data 云 API 仍旧 | 库未 re-import | 跑后端导入 |
| 搜索找不到新词 | 未 data:sync | `npm run data:sync` |
| 图片 404 | 路径错或未提交 assets | 检查 `src/assets/img/...` |

## 8. 以后若要做「真·后台」

当前脚本即轻量 ETL。正式后台上线后，建议：**后台改库 → 导出 JSON 快照 → 仍走 `data:sync` 生成前端 split**，或前端完全只读 API、不再依赖 JSON。
