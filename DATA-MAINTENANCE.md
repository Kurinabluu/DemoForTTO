# TTO 内容数据维护指南

适用：`src/data/data.json`、split / fallback、**Aiven 云数据库**。

**管理后台已独立**：见旁目录 [`tto-admin`](../tto-admin/README.md)（勿再往本游客站塞 `/admin`）。

管理端本地默认：`http://127.0.0.1:5174`  
种子账号：`tto-backend/sql/seed_tto_admin.sql`（`tto_admin` / `TtoAdmin@2026!`，上线改密）  
API 说明：[`tto-backend/docs/admin-api.md`](../tto-backend/docs/admin-api.md)

### 管理端能改什么（日常运维）

| 场景 | 管理端页面 | 说明 |
| --- | --- | --- |
| 改标题/描述/地点/亮点/标签 | 内容详情 | 直接写库，游客站 API 即时生效 |
| 上下架 | 内容列表 / 详情 | `status` 0/1 |
| 六大商业服务文案与结构 | 商业服务 | 编辑 `serviceConfig` JSON |
| 咨询跟进 | 咨询列表 / 详情 | 状态 + 内部备注 |
| 管理员账号 | 账号管理 | 勿与游客用户混用 |

**仍需 import 的场景**：大批量从 `data.json` 初灌、整库重建、JSON 与库差异很大的一次性同步。

---

## 0. 谁才是「唯一真相」？（上线后必看）

**云上演示（gh-pages + Render）运行时，只有数据库是数据源。**  
前端 `VITE_USE_API=true` 且关闭 JSON fallback 时，页面内容 **全部来自 API → MySQL**，**不会**读仓库里的 `data.json`。

| 角色 | JSON（`data.json`） | 数据库（Aiven） |
| --- | --- | --- |
| 线上用户看到的 | ❌ 不参与 | ✅ **唯一来源** |
| 你的编辑草稿 / 批量工具 | ✅ 方便改、可版本管理 | 可选直接 SQL |
| 灌库 / 初次上线 | ✅ 导入种子 | 接收导入 |
| 日常运维默认 | 备份与 Git 历史 | **以库为准** |
| 商业服务页（包车/定制等） | 导入时写入 `service_config_json` | ✅ API `/tto/services/*` |

因此 **不是**「两个数据源同时生效」，而是：

```
JSON  ──(仅在你主动 import 时)──▶  数据库  ──API──▶  网站
         平时不自动同步
```

### ⚠️ TTO 批量导入的真实行为（重要）

Render 上请保持 **`TTO_IMPORT_ENABLED=false`**（默认已是 false）。

导入安全开关（`application.yml` / 环境变量）：

| 变量 | 默认 | 含义 |
| --- | --- | --- |
| `TTO_IMPORT_PRUNE_MISSING` | **false** | true 时会删除 JSON 未出现的 section/subNav/item |
| `TTO_IMPORT_OVERWRITE_EXISTING` | true | false 时已存在的 itemKey **不覆盖**（仅插入新条目） |
| `TTO_IMPORT_CLEAR_BEFORE_IMPORT` | false | true 时清表重建（生产严禁） |

**不要**在内容已在线后，用旧 JSON 再跑一遍全量覆盖导入，除非你确认 JSON 是完整真相。

**绝不要**在生产环境开 `TTO_IMPORT_CLEAR_BEFORE_IMPORT=true` / `import` profile，除非要清库重建。

### 云库增量：商业服务配置

已有库请依次执行：

1. `tto-backend/sql/migrations/20260727_tto_section_service_config.sql`
2. `tto-backend/sql/migrations/20260727_tto_section_service_config_backfill.sql`

（或临时开启 import，让 `serviceConfig` 写入 `tto_section.service_config_json`）

### 推荐工作流（已有云库之后）

| 你要做的事 | 推荐做法 |
| --- | --- |
| 改几条景点文案上云 | **直接改 Aiven**（SQL / 以后的管理后台），或改 JSON 后 **一次性、有 conscious 地 import** |
| 只在本地/Git 留底 | 改 `data.json` → `npm run data:sync` → commit（**不必**每次推代码都 import） |
| 库里有新数据、JSON 落后 | **以库为准**；需要时再 export 回 JSON，不要 import 覆盖 |
| 新增一批条目 | 改 JSON → 确认 itemKey → **手动 import 一次**（新 key 会插入；同 key 会覆盖） |

---

## 1. 黄金规则

1. **只改源文件**：日常编辑 `src/data/data.json`（不要直接改 `split/` 或 `fallback/`，它们由脚本生成）。
2. **改完必同步**：`npm run data:sync`（`dev` / `prebuild` / CI 也会自动跑）。
3. **改完必提交**：未提交的 `data.json` 不要用 `git restore` 覆盖；清理仓库前先 `git add` / commit。
4. **稳定主键**：每条景点保留 `itemKey`；导入时同 key **会覆盖** 库中同条记录（见 §0）。
5. **上云灌库**：仅首次或 **你确认要 JSON→DB 对齐时** 才开 import；日常 Render **`TTO_IMPORT_ENABLED=false`**。

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

## 6. 同步到云数据库（仅在有需要时手动执行）

**前提**：Render 生产环境 **`TTO_IMPORT_ENABLED=false`**，避免每次重启误导入。

仅在「JSON 已改完、且你确认要用 JSON 覆盖/补齐数据库」时：

1. `tto-demo`：`npm run data:sync`，确认 `data.json` 含所有应保留的 itemKey
2. 临时设置（本地连 Aiven 或 Render 一次性 Job）：

```powershell
$env:TTO_IMPORT_ENABLED = "true"
$env:TTO_IMPORT_CLEAR_BEFORE_IMPORT = "false"
$env:TTO_IMPORT_SOURCE_PATH = "V:/WebForZanChen/tto-demo/src/data/data.json"
```

3. 启动 import 一次，完成后 **`TTO_IMPORT_ENABLED=false`**
4. 验证：`SELECT item_key, title FROM tto_content_item ORDER BY id DESC LIMIT 10;`

**若数据库已是权威、JSON 只是个人编辑习惯**：改库即可，**不要** import；需要时再把库 export 回 JSON 做备份。

## 7. 常见错误

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 改了 data.json 线上没变 | 未 push / Actions 未跑完 | 推 `viewDemo`，看 Actions |
| 改了 data 云 API 仍旧 | 库未 re-import | 跑后端导入 |
| 搜索找不到新词 | 未 data:sync | `npm run data:sync` |
| 图片 404 | 路径错或未提交 assets | 检查 `src/assets/img/...` |

## 8. 以后若要做「真·后台」

当前脚本即轻量 ETL。正式后台上线后，建议：**后台改库 → 导出 JSON 快照 → 仍走 `data:sync` 生成前端 split**，或前端完全只读 API、不再依赖 JSON。
