# tto demo

这是 tto 项目的前端 Demo。

## 运行配置

开发或生产环境常用配置见 `.env.development` / `.env.production`：

- `VITE_USE_API=true`：启用后端 API
- `VITE_API_BASE_URL=/api`：API 基础路径
- `VITE_APP_BASE=/DemoForTTO/`：gh-pages 子路径部署前缀

## 登录与收藏

- 登录态保存在本地存储中。
- 请求后端时会自动携带 `token` 请求头。
- 当后端返回新的 `X-Auth-Token` 时，前端会自动更新本地 token。
- 收藏页会根据当前收藏项自动补全特别活动、景点、餐厅、住宿等内容。

## 数据说明

- 免费信息页的网格内容优先使用后端 API。
- 本地 `src/data/split/freeinfo.json` 负责保留完整卡片样式与补充字段。
- `isGrid=false` 的特别活动、徒步线路、塔州露营地等内容，会以本地富数据为主，再与 API 的 `id` / 标题做合并。