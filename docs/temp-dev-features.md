# 临时开发功能 - 本地 JSON 兜底

## 功能说明

这是一个**临时开发功能**，用于在没有可用数据库的后端时，提供本地 JSON 文件作为数据兜底。

**重要说明**：
- **本地开发环境**：有数据库，**不启用**兜底功能（`.env.development` 中 `VITE_USE_LOCAL_JSON_FALLBACK=false`）
- **生产环境（gh-pages）**：无数据库，**启用**兜底功能（`.env.production` 中 `VITE_USE_LOCAL_JSON_FALLBACK=true`）

## 使用场景

- **仅用于生产环境（gh-pages）**：在没有数据库的后端部署时提供数据兜底
- API 接口调用失败且 `isApiEnabled = false`
- 后端服务未启动
- 需要快速演示前端功能

## 启用方式

### 1. 环境变量配置

**生产环境（`.env.production`）**：
```bash
VITE_USE_LOCAL_JSON_FALLBACK=true
```

**本地开发环境（`.env.development`）**：
```bash
VITE_USE_LOCAL_JSON_FALLBACK=false
```

### 2. 数据文件

确保以下文件存在且数据完整：

- `src/data/fallback/freeinfo_fallback.json` - 自助游/自驾游免费参考信息数据
- `src/data/fallback/daytrip_fallback.json` - 一日游/多日游数据

这些文件应与 `src/data/split/` 目录下的正式数据文件保持同步。

## 工作原理

当系统检测到以下情况时，会自动使用本地 JSON 兜底数据：

1. API 未启用（`isApiEnabled = false`）
2. API 调用失败（网络错误、服务不可用等）
3. API 返回空数据（导航树为空等）
4. 所有子导航的 items 都为空

兜底逻辑位于：`src/utils/contentRepository.js`

## 删除计划

当后端数据库正式上线且功能稳定后，**必须删除此临时功能**。

### 删除步骤

1. **删除数据文件**
   ```bash
   rm src/data/fallback/freeinfo_fallback.json
   rm src/data/fallback/daytrip_fallback.json
   rm -rf src/data/fallback/
   ```

2. **删除配置**
   
   从 `.env.production` 中删除以下内容：
   ```bash
   # [临时开发功能] 本地 JSON 兜底配置
   # ... (相关注释)
   VITE_USE_LOCAL_JSON_FALLBACK=true
   ```
   
   从 `.env.development` 中删除以下内容：
   ```bash
   # [临时开发功能] 本地 JSON 兜底配置
   # ... (相关注释)
   VITE_USE_LOCAL_JSON_FALLBACK=false
   ```

3. **删除代码**
   
   从 `src/utils/contentRepository.js` 中删除：
   - 顶部的注释块（[临时开发功能] 部分）
   - `import freeinfoFallbackData from '@/data/fallback/freeinfo_fallback.json'`
   - `import daytripFallbackData from '@/data/fallback/daytrip_fallback.json'`
   - `USE_LOCAL_JSON_FALLBACK` 常量
   - `loadLocalFallbackData()` 函数
   - `hasValidSubNavData()` 函数
   - `loadSectionBundle()` 函数中所有 `[临时开发功能]` 标记的代码块

4. **恢复原有代码**
   
   将 `loadSectionBundle()` 函数恢复为原始版本（移除兜底逻辑）。

5. **删除文档**
   
   删除 `docs/temp-dev-features.md`

6. **测试验证**
   
   确保在正常 API 环境下功能正常工作。

## 注意事项

- 此功能仅用于**生产环境（gh-pages）**，本地开发环境**不启用**
- 兜底数据文件应定期与正式数据文件保持同步
- 删除功能前务必在测试环境充分验证
- 删除后应删除相关文档

## 相关文件清单

- `src/utils/contentRepository.js` - 兜底逻辑实现
- `src/data/fallback/freeinfo_fallback.json` - 免费信息兜底数据
- `src/data/fallback/daytrip_fallback.json` - 一日游兜底数据
- `.env.production` - 生产环境配置（启用兜底）
- `.env.development` - 开发环境配置（不启用兜底）
- `docs/temp-dev-features.md` - 本文档

---

**创建日期**: 2026-06-18  
**预计删除日期**: 后端数据库正式上线后
