# Task 01 需求符合性评审

**结论：PASS**

## 复审结论

原阻塞项已修复，没有发现新的 Task 1 需求偏差。

### 1. `StrictMode` 首屏只发送一次

- `src/App.tsx:3377` 使用组件实例内的 `lastPageViewSignatureRef` 保存最近一次页面签名。
- `src/App.tsx:3549-3566` 在发送前比较完整 page-view 签名；React `StrictMode` 对同一挂载的 effect replay 会命中相同签名并跳过第二次发送。
- `src/App.test.tsx:162-187` 按真实入口包裹 `<StrictMode>`，实测首屏只有一个事件。

### 2. 往返 SPA 导航不会被误去重

- 签名只与上一条页面事件比较，不是永久集合；`/ → /stats → /` 的相邻签名依次不同。
- `src/App.test.tsx:177-186` 实测得到且仅得到三条 `page_path`：`/`、`/stats`、`/`。

### 3. 全新 App 实例或刷新仍会发送首屏事件

- 去重状态是 `App` 内部的 `useRef`，不是模块级或 `window` 全局状态；卸载后创建新 App 实例会得到新的 `null` ref。
- 因此真实刷新和新的 mount 不会继承旧签名，也不会吞掉新的首屏事件。

### 4. 隐私与字段边界保持正确

- `src/App.tsx:3550-3557` 删除完整 `board` 查询参数和 hash，但保留 `utm_source` 等正常查询参数。
- `src/App.test.tsx:213-230` 的隐私回归测试仍通过。
- `route_type` 来自 `src/App.tsx:85-94` 的稳定有限映射；详情路由没有新增 Pokémon/Declaration ID 自定义参数。
- 当前生产调用仍只有 `trackPageView`；未接入声明、分享、Picker、Game 或 Tally 业务行为。`AnalyticsEventName` 仅预声明受控名称，不构成 Task 2+ 实现。
- 没有把训练家姓名、声明理由、反馈正文、Tally submission ID、完整 Picker board 或其他业务对象发送给 GA4。

### 5. 其他 Task 1 要求

- `src/lib/analytics.ts:31-33`：`window.gtag` 缺失时安全 no-op。
- `index.html:13`：`send_page_view: false` 已关闭 GA4 自动首屏事件。
- `src/App.tsx:3515-3547` 先同步 `document.title`，随后才执行 `src/App.tsx:3549-3566` 的 page-view effect，标题时序正确。

## 本次验证证据

- `npx vitest run src/lib/analytics.test.ts src/App.test.tsx -t "analytics|tracks one initial page view|deduplicates the StrictMode|uses a stable route type|removes a Picker board"`：通过，2 个文件，8 个测试通过、11 个无关测试跳过。
- 生产代码范围搜索：业务事件名称只存在于 `AnalyticsEventName` 类型；`trackEvent` 没有业务调用点。
- `git diff --check`：通过；仅有 Git 的 LF/CRLF 工作区提示。

Task 1 可进入代码质量评审。
