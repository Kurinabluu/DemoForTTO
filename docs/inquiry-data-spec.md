## 咨询数据规范

本文用于统一 `tto` 站内所有“联系我们 / 咨询弹窗”提交的数据格式，方便后续优化数据库结构和做来源统计。

### 1. 现有落库字段

当前后端咨询表使用的是 `tto_inquiry`，核心字段建议保持如下语义。

**部署说明**：咨询提交走 `POST /api/tto/inquiries`，需要可访问的后端；gh-pages 静态站若未部署 API，咨询功能不可用。

- `contactName`：联系人姓名，必填。
- `phone`：联系电话，必填。
- `email`：邮箱，选填。
- `inquiryType`：咨询类型，例如 `contact`、`trip-consult`、`service-consult`。
- `sourceSection`：来源页面与来源模块，必填，建议统一格式。
- `content`：咨询内容，必填。
- `status`：处理状态，默认 `new`。
- `userId`：登录用户 ID，未登录可为空。
- `createdAt` / `updatedAt`：时间字段，用于排序和追踪。

### 2. `sourceSection` 统一格式

为了让咨询数据能准确定位“从哪个页面、哪个模块、哪个内容条目发起”，`sourceSection` 建议统一写成内部编码：

```text
pageKey::moduleKey::entryKey
```

其中 `entryKey` 可选。只有页面本身没有更细条目时，可以只存 `pageKey::moduleKey`。

示例：

- `site-layout::header-contact-form`
- `service-showcase::charter-service`
- `trip-detail::day-trip::bruny-island`
- `free-info::scenic::bruny-island`

这样后续如果需要统计不同入口的咨询量，可以直接按字符串前后拆分，或者在数据库优化时再拆成独立字段。

### 3. 建议的前端提交约定

所有咨询入口提交时都应至少带上：

- `contactName`
- `phone`
- `email`
- `inquiryType`
- `sourceSection`
- `sourcePageKey`
- `sourceModuleKey`
- `sourceEntryKey`
- `content`

其中：

- `inquiryType` 用来区分业务大类，便于后台列表过滤。
- `sourceSection` 继续作为兼容字段，但新数据建议直接传 `sourcePageKey/sourceModuleKey/sourceEntryKey`。
- 页面名称和模块名称可以作为显示文案保留，但数据库里优先存内部编码。

### 4. 推荐的后续数据库优化方向

如果后续要做更细的分析，建议把 `sourceSection` 拆成以下字段：

- `sourcePage`：页面标识
- `sourceModule`：模块标识
- `sourceEntry`：更细的入口说明，可选
- `sourcePageKey`：页面内部编码
- `sourceModuleKey`：模块内部编码
- `sourceEntryKey`：内容条目内部编码，可选

这样可以避免把多个维度塞进一个字符串里，后续做报表、筛选和运营分析会更方便。

### 5. 本次前端改造目标

本次调整会统一以下入口的咨询弹窗：

- 顶部导航“联系我们”
- 一日游 / 多日游详情弹窗
- 免费信息详情弹窗
- 服务展示页咨询弹窗

所有这些入口在提交咨询时，都应把 `sourceSection` 带上页面和模块信息。
