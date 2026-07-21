# tto-demo 文档索引

| 文档 | 说明 |
| --- | --- |
| [../README.md](../README.md) | 项目概览、环境变量、数据策略 |
| [location-catalog.md](./location-catalog.md) | 内容同步、`catalog:*` 命令、地点目录单源 |
| [scroll-session.md](./scroll-session.md) | 路由与滚动位置恢复 |
| [temp-dev-features.md](./temp-dev-features.md) | gh-pages JSON 内容兜底（非 API 失败降级） |
| [pre-launch-checklist.md](./pre-launch-checklist.md) | 前端上线前检查清单 |
| [test-report.md](./test-report.md) | 2026-06-18 历史测试快照（部分条目已过时，以 README 为准） |
| [inquiry-data-spec.md](./inquiry-data-spec.md) | 咨询表单字段与 `sourceSection` 规范 |

## 自动化

- [../.github/workflows/gh-pages.yml](../.github/workflows/gh-pages.yml) — 推送 main/master 时 `data:sync` → `build` → 部署 gh-pages

## 与后端文档的交叉引用

- API 契约：`tto-backend/docs/api-contract.md`
- 导入流程：`tto-backend/docs/import-guide.md`
