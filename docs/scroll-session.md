# 会话恢复：路由与滚动位置

本文说明 tto 前端如何记住用户上次访问的页面与滚动位置，以及与列表加载的协作方式。

## 存储键（localStorage）

| 键名 | 用途 |
| --- | --- |
| `tto_last_path` | 上次完整路由路径（不含 `#` 锚点），用于再次打开站点时跳回 |
| `tto_scroll_by_path` | JSON 对象，按路由 `fullPath` 分别保存 `scrollY` |
| `tto_last_scroll_y` | 兼容旧版：最近一次滚动位置；当某路由在 `tto_scroll_by_path` 中无记录且等于 `tto_last_path` 时作为回退 |
| `tto_first_visit_done` | 是否已完成首次访问引导 |
| `tto_selected_subnav` | 上次选中的子导航名称 |

## 行为概览

### 1. 按路由保存滚动

用户滚动时，`main.js` 与 `App.vue` 会将当前 `window.scrollY` 写入：

```text
tto_scroll_by_path["/DemoForTTO/trips/freeinfo?subNavName=景点"] = 4820
```

不同页面互不影响。例如：

- 在「景点」页滚到 Central Highlands → 只更新该 `fullPath` 的记录
- 切换到「包车服务」→ 恢复该服务页自己的滚动位置，而不是景点页的深度

### 2. 再次进入站点

1. `router.beforeEach` / `App.vue` 根据 `tto_last_path` 跳转到上次页面
2. `router.afterEach` 读取**当前路由**在 `tto_scroll_by_path` 中的值并恢复
3. 若页面内容异步加载（如 `TripsGrid`），恢复逻辑会通过 rAF 循环等待 DOM 高度增长

### 3. 与列表渲染 / 懒加载

**默认景点 / 餐厅 / 住宿列表（无搜索）**

- 按地点分区一次渲染全部条目（`shouldShowAllLocationGridItems`），不使用 `renderLimit` 截断
- API 模式下分区数据来自 `/api/tto/location-sections`；gh-pages 模式来自 fallback JSON 本地分组

**搜索、一日游、特别活动等仍使用 `renderLimit` 的页面**

- 日常浏览：通过滚动触底 / `IntersectionObserver` 增量加载
- 恢复滚动：`main.js` 中最多 **600 帧 rAF**（约 10 秒）重试；**仅在页面总高度增加时**才执行 `scrollTo`，避免每帧反复滚动干扰懒加载
- 带 `dialogItemId` 且无 `?s=` 时，`TripsGrid` 会通过 `loadAllItems()` / `locateTargetPageForDialogItem()` 扩展可见条目以定位弹窗目标

**说明**：当前实现**不会**在恢复前主动抬高 `renderLimit`；依赖上述 rAF 重试与懒加载自然增高页面。

### 4. `tto:content-ready` 事件（预留）

`main.js` 监听了 `tto:content-ready`，收到后会再次尝试恢复当前路由滚动。

当前 **`TripsGrid` 尚未派发**该事件；恢复主要依赖 `router.afterEach` + rAF 循环。若后续在数据/分区加载完成时派发该事件，可进一步改善深位置恢复。

### 5. 强制回顶部

Header / 导航中调用 `scrollToTop()` 时：

- 会设置 `resetScrollOnNextRoute`
- 下一次路由 `afterEach` 将目标路由的滚动记录写为 `0`，并滚到顶部

以下路由**始终滚到顶部**，不参与恢复：

- 带搜索参数 `?s=` 的路由
- 消费了 `resetScrollOnNextRoute` 的路由

## 地点排序与网格加载

| 环境 | 行为 |
| --- | --- |
| **本地开发**（`VITE_USE_API=true`，`VITE_USE_LOCAL_JSON_FALLBACK=false`） | 景点/餐厅/住宿列表与排序走后端 API；API 失败直接报错，**不**静默回退 JSON |
| **gh-pages**（`VITE_USE_API=false`，`VITE_USE_LOCAL_JSON_FALLBACK=true`） | 使用 `src/data/fallback/*.json`；列表页内搜索为前端本地匹配 |

| sortMode | 说明 |
| --- | --- |
| `postcode` | 按邮编（默认） |
| `nameEn` | 按英文地名 |
| `nameZh` | 按中文地名 |

**API 模式**：分区标题由后端 `/api/tto/location-sections` 返回的 `section.title` 决定（含 `nameZh` 排序时的中文展示）。

**gh-pages 模式**：由前端 `getLocationDisplayLabel()` + `src/data/tas-location-postcodes.json` 拼接展示。

中文名来源：后端 `tto_location.name_zh`（由 `tas-location-postcodes.json` 种子同步）；gh-pages 以目录 JSON 中的 `nameZh` 为准。

### TripsGrid 后端加载超时

API 模式下请求地点目录与 `location-sections` 时，单次超时 **15 秒**（`BACKEND_GRID_LOAD_TIMEOUT_MS`）。超时后会结束 loading 并提示检查后端，避免页面无限「加载中…」。

## `belongsToSpot` 与「所在景点」展示

`belongsToSpot` 可用于：

1. **母子景点**：值为父卡片 `enTitle`（如 `Cradle Mountain`），可点击打开父卡片详情
2. **区域归属**：值为区域标识（如 `Hobart`），展示为「霍巴特」，**无对应主卡片时为纯文本、不可点击**

展示名经 `resolveBelongsToSpotDisplayName()` 解析（主景点中文名 → 区域映射 → 目录 `nameZh` → 原值）。

## 恢复失败时的保护

若在约 10 秒（600 帧 rAF）内仍无法滚到目标位置（例如网络慢、内容未加载完）：

- **不会**用错误的中间位置覆盖 `tto_scroll_by_path` 中已保存的值
- 用户下次进入仍保留原目标位置

恢复过程中 `isRestoringScroll === true`，滚动监听不会写入 localStorage，避免污染记录。

## 相关源码

| 文件 | 职责 |
| --- | --- |
| `src/stores/nav.js` | 路径/滚动读写、`resetScrollOnNextRoute`、`isRestoringScroll` |
| `src/main.js` | 全局滚动监听、路由后 rAF 恢复、`tto:content-ready` 监听（预留） |
| `src/App.vue` | 电梯导航滚动监听（附带保存） |
| `src/layouts/Layout.vue` | 导航点击时 `scrollToTop` + 重置下一页滚动 |
| `src/views/TripsGrid.vue` | 地点分区网格、后端 15s 超时、`shouldShowAllLocationGridItems` |

## 调试建议

1. 打开 DevTools → Application → Local Storage，查看 `tto_scroll_by_path`
2. 确认当前地址栏 `fullPath` 与 JSON 中的键一致（含 query，如 `subNavName`）
3. 若恢复位置偏低，检查该页是否仍在 loading、或 API 分区是否尚未返回
4. 清除 `tto_scroll_by_path` 可重置所有页面的滚动记忆，不影响登录/收藏等其它键
