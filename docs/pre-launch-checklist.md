# tto 前端上线前检查清单

> 创建日期：2026-06-18  
> 目标：确认tto前端项目达到真实上线标准所需的工作

---

## 一、当前进度总结

### ✅ 已完成的核心功能

#### 页面展示
- ✅ 景点网格展示（已修复iPad mini样式问题）
- ✅ 详情弹窗正常工作
- ✅ 导航和子导航展示
- ✅ 搜索功能正常
- ✅ 一日游/多日游展示
- ✅ 6大商业服务展示

#### 用户功能
- ✅ 登录系统（HttpOnly Cookie + 标签页同步 + JWT自动续期）
- ✅ 浏览器不再保存认证 token
- ✅ 收藏功能（已接入后端API）
- ✅ 咨询功能（已接入后端API）
- ✅ 登录态管理
- ✅ 收藏同步（登录后本地收藏迁移到账号收藏）

#### 安全与工程化
- ✅ 密码加密已改为 bcrypt
- ✅ JWT 密钥改为环境配置
- ✅ CORS 已收紧为可配置白名单
- ✅ 登录失败限流已加入
- ✅ 前端 `lint` 已接入

#### 数据兜底（gh-pages 静态内容）

- ✅ gh-pages 生产构建使用 fallback JSON（**非** API 失败触发）
- ✅ `npm run data:sync` + GitHub Actions 自动同步 fallback
- ✅ 开发环境 API 失败不回退 JSON

#### 地点与排序

- ✅ 地点目录单源：`src/data/tas-location-postcodes.json`
- ✅ API 模式：`/api/tto/locations`、`/api/tto/location-sections` + `sortMode`
- ✅ `belongsToSpot` 支持母子景点与区域归属（如 Hobart → 霍巴特）

#### 样式适配
- ✅ PC端适配
- ✅ iPad端适配
- ✅ iPad mini端适配（已修复网格对齐问题）
- ✅ 手机端适配

---

## 二、达到上线标准必须完成的工作

### 🔴 必须优化（上线前必须完成）

#### 1. 生产环境配置验证

**说明**：gh-pages **内容**不走 API（`VITE_USE_API=false`）；登录/收藏/咨询若需可用，须部署带后端的正式环境。

**必须完成**：
- [ ] 验证 `.env.production`：`VITE_USE_API=false`，`VITE_USE_LOCAL_JSON_FALLBACK=true`
- [ ] gh-pages：验证 fallback JSON 内容加载、页内搜索、样式
- [ ] 正式环境（有后端）：验证 API、登录、收藏、咨询

**优先级**：🔴 最高

#### 2. API 连接测试（本地开发 / 正式部署）

**必须完成**（`VITE_USE_API=true` 的环境）：
- [ ] 景点列表与 `location-sections` API
- [ ] 景点详情 API
- [ ] 全站搜索 API（`/api/tto/search`）
- [ ] 收藏、咨询、登录 API

**优先级**：🔴 最高

#### 3. gh-pages fallback 验证

**必须完成**：
- [ ] 执行 `npm run build` 后 fallback JSON 已打入 bundle
- [ ] gh-pages 站点不请求 `/api/tto/items` 等内容 API
- [ ] 列表、详情、页内搜索正常

**不要**在开发环境验证「API 失败自动回退 JSON」——该行为已移除。

**优先级**：🔴 最高

#### 4. 样式最终检查

**问题**：需要确认所有设备样式正常

**必须完成**：
- [ ] PC端样式最终检查
- [ ] iPad端样式最终检查
- [ ] iPad mini端样式最终检查
- [ ] 手机端样式最终检查
- [ ] 各种分辨率下的样式检查

**优先级**：🔴 最高

---

### 🟡 应该优化（上线后尽快完成）

#### 1. 性能优化

**当前状态**：基础功能完成，性能未优化

**应该完成**：
- [ ] 图片懒加载优化
- [ ] 资源压缩优化
  - 新增或替换图片后需手动执行 `npm run images:thumb`
- [ ] API请求缓存
- [ ] 页面加载速度优化
- [ ] 移动端性能优化

**优先级**：🟡 高

#### 2. 用户体验优化

**当前状态**：基础功能完成

**应该完成**：
- [ ] 加载状态优化（更友好的loading提示）
- [ ] 错误提示优化（更明确的错误信息）
- [ ] 操作反馈优化（更流畅的交互）
- [ ] 移动端手势优化
- [ ] 动画效果优化

**优先级**：🟡 中

#### 3. SEO优化

**当前状态**：基础meta标签

**应该完成**：
- [ ] 页面标题优化
- [ ] meta描述优化
- [ ] 结构化数据标记
- [ ] 图片alt标签优化
- [ ] URL结构优化

**优先级**：🟡 中

---

### 🟢 可以优化（后续迭代）

#### 1. 高级功能

**可以优化**：
- [ ] 离线访问支持（PWA）
- [ ] 深色模式支持
- [ ] 多语言支持
- [ ] 社交分享功能
- [ ] 地图集成

**优先级**：🟢 低

#### 2. 数据可视化

**可以优化**：
- [ ] 收藏统计图表
- [ ] 用户行为分析
- [ ] 内容热度展示
- [ ] 个性化推荐

**优先级**：🟢 低

---

## 三、临时功能清理计划

### 需要删除的临时功能

#### 本地JSON兜底功能

**文件位置**：
- `src/utils/contentRepository.js`（临时代码块）
- `src/data/fallback/`（临时数据文件）
- `.env.production`（临时配置）
- `.env.development`（临时配置）
- `docs/temp-dev-features.md`（临时文档）

**删除条件**：后端数据库正式上线且稳定运行后

**删除步骤**：见`docs/temp-dev-features.md`

---

## 四、测试验收清单

### 功能测试

#### 必须通过的测试

- [ ] **景点展示**：所有景点能正常显示
- [ ] **详情弹窗**：所有详情弹窗能正常打开
- [ ] **搜索功能**：搜索能返回正确结果
- [ ] **登录功能**：登录能成功，会话能自动续期
- [ ] **收藏功能**：收藏能落库，换设备不丢失
- [ ] **咨询功能**：咨询能提交，后台能查看
- [ ] **母子景点**：子景点能关联并打开母卡片详情
- [ ] **区域归属**：`belongsToSpot: Hobart` 等显示「霍巴特」，无母卡片时为文本不可点
- [ ] **地点筛选**：地点筛选与三种排序（邮编/英文/中文）正常
  - API 模式排序由后端 `sortMode` 提供
  - gh-pages 模式由前端目录 JSON + fallback 数据本地处理
  - TripsGrid 后端加载超时 15s 后应停止 loading 并提示

#### 应该通过的测试

- [ ] **性能测试**：页面加载时间 < 3秒
- [ ] **兼容性测试**：主流浏览器正常工作
  - Chrome
  - Firefox
  - Safari
  - Edge
- [ ] **移动端测试**：手机端体验良好
  - iOS Safari
  - Android Chrome
  - 微信内置浏览器

---

## 五、部署流程

### gh-pages 部署流程

1. **推送 main 或 master**（推荐）
   - GitHub Actions [`.github/workflows/gh-pages.yml`](../.github/workflows/gh-pages.yml) 自动执行：
     - `npm run data:sync`
     - `npm run catalog:scan`（仅报告，不阻断）
     - `npm run build`
     - 发布 `dist/` 到 `gh-pages` 分支

2. **本地手动构建**（调试）
   ```bash
   npm run data:sync
   npm run build
   ```

3. **验证**
   - 访问 gh-pages 地址
   - 内容列表来自 fallback JSON（非内容 API）
   - 样式与页内搜索正常

---

## 六、环境配置说明

### 生产环境配置（`.env.production`，gh-pages）

```bash
VITE_USE_API=false
VITE_API_BASE_URL=/api
VITE_APP_BASE=/DemoForTTO/
VITE_USE_LOCAL_JSON_FALLBACK=true
```

### 开发环境配置（`.env.development`）

```bash
VITE_USE_API=true
VITE_API_BASE_URL=/api
VITE_APP_BASE=/DemoForTTO/
VITE_USE_LOCAL_JSON_FALLBACK=false
```

---

## 七、当前状态总结

### ✅ 已完成（约80%）

- 页面展示功能
- 用户功能（登录、收藏、咨询）
- 数据兜底功能
- 样式适配
- 基础文档

### 🔴 必须完成（约15%）

- 生产环境配置验证
- API连接测试
- 兜底功能验证
- 样式最终检查

### 🟡 应该完成（约5%）

- 性能优化
- 用户体验优化
- SEO优化

---

**结论**：前端项目已完成大部分功能开发，距离上线还需要完成生产环境验证和测试验收。最快可在1天内完成必须项并上线。