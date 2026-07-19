# 会话恢复：路由与滚动位置

本文说明 tto 前端如何记住用户上次访问的页面与滚动位置，以及与懒加载的协作方式。

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
3. 若页面内容异步加载（如 `TripsGrid`），会等待内容就绪后再恢复

### 3. 与懒加载的隔离

**默认景点 / 餐厅 / 住宿列表（无搜索）**

- 按地点分区一次渲染全部条目，不使用 `renderLimit` 截断
- 恢复滚动仅依赖数据/API 分区加载完成

**搜索、一日游、特别活动等使用 `renderLimit` 的页面**

- 日常浏览：仍通过滚动触底 / `IntersectionObserver` 增量加载
- **仅在恢复会话时**：`TripsGrid` 会根据该路由已保存的 `scrollY` **预估并临时抬高** `renderLimit`，以便页面高度足够
- `main.js` 恢复滚动时：**只在页面总高度增加时**才执行 `scrollTo`，避免每帧反复滚动干扰懒加载

### 4. 内容就绪事件

`TripsGrid` 在以下时机会派发 `tto:content-ready`：

- 免费信息/一日游数据加载完成
- 后端地点分区（`location-sections`）加载完成

全局监听该事件后会**再次**尝试恢复当前路由的滚动位置（此时 DOM 高度通常已足够）。

### 5. 强制回顶部

Header / 导航中调用 `scrollToTop()` 时：

- 会设置 `resetScrollOnNextRoute`
- 下一次路由 `afterEach` 将目标路由的滚动记录写为 `0`，并滚到顶部

带搜索参数 `?s=` 的路由始终滚到顶部，不参与恢复。

## 地点排序（邮编 / 英文 / 中文）

| 环境 | 行为 |
| --- | --- |
| **本地开发**（`VITE_USE_API=true`） | 景点/餐厅/住宿由后端 API 排序；API 失败直接报错，不静默回退 JSON |
| **gh-pages**（`VITE_USE_LOCAL_JSON_FALLBACK=true`，`VITE_USE_API=false`） | 使用 `src/data/fallback/*.json`，前端本地排序与搜索 |

| sortMode | 说明 |
| --- | --- |
| `postcode` | 按邮编 |
| `nameEn` | 按英文地名 |
| `nameZh` | 按中文地名；API 模式下分区标题为「中文名 + 英文标签」 |

中文名（API 模式）：`tto_location.name_zh` + JSON 种子。gh-pages 兜底数据以 fallback JSON 中的 `nameZh` 为准。

### 6. 恢复失败时的保护

若在约 10 秒内仍无法滚到目标位置（例如网络慢、内容未加载完）：

- **不会**用错误的中间位置覆盖 `tto_scroll_by_path` 中已保存的值
- 用户下次进入仍保留原目标位置

恢复过程中 `isRestoringScroll === true`，滚动监听不会写入 localStorage，避免污染记录。

## 相关源码

| 文件 | 职责 |
| --- | --- |
| `src/stores/nav.js` | 路径/滚动读写、`resetScrollOnNextRoute` |
| `src/main.js` | 全局滚动监听、路由后恢复、`tto:content-ready` 监听 |
| `src/App.vue` | 电梯导航滚动监听（附带保存） |
| `src/layouts/Layout.vue` | 导航点击时 `scrollToTop` + 重置下一页滚动 |
| `src/views/TripsGrid.vue` | 恢复前扩展 `renderLimit`、`tto:content-ready` |

## 调试建议

1. 打开 DevTools → Application → Local Storage，查看 `tto_scroll_by_path`
2. 确认当前地址栏 `fullPath` 与 JSON 中的键一致（含 query，如 `subNavName`）
3. 若恢复位置偏低，检查该页是否仍在 loading、或 API 分区是否尚未返回
4. 清除 `tto_scroll_by_path` 可重置所有页面的滚动记忆，不影响登录/收藏等其它键
