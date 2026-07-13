# Task 01 代码质量评审

**结论：PASS**

## 评审范围

- `src/lib/analytics.ts`
- `src/lib/analytics.test.ts`
- `src/App.tsx`
- `src/App.test.tsx`
- `src/vite-env.d.ts`
- `index.html`

## 结论与证据

### 1. Analytics API 与类型封装

- `AnalyticsEventName`、`AnalyticsRouteType` 和 `PageViewParameters` 将事件名、有限路由类型与页面字段收敛到单一适配层，调用方不直接操作 `window.gtag`。
- `sendEvent` 集中处理浏览器环境与 `gtag` 缺失场景；no-op 路径不会改变产品行为。
- `trackPageView` 显式映射 GA4 字段，没有把页面或业务对象整体透传；`trackEvent` 也只接受可序列化的标量参数记录，足以支撑后续任务按事件构造白名单字段。
- `Window.gtag` 声明与当前调用签名一致，没有使用 `any` 或额外全局状态。

### 2. React effect、标题时序与 StrictMode 去重

- metadata effect 位于 page-view effect 之前，同一次提交按声明顺序执行，发送时读取到已同步的 `document.title`。
- 去重状态保存在 `App` 实例内的 `useRef`，只比较相邻完整页面签名：能够消除 StrictMode 对同一次 effect 的 replay，又不会跨卸载/刷新污染，也不会吞掉 `/ → /stats → /` 的返回访问。
- 依赖包含 `route`、`language`、`declarationId`、`pokemonSlug`，覆盖核心页、语言切换以及两类详情页的 canonical SPA 导航；没有依赖对象引用导致的重复事件。
- 路由类型通过 `satisfies Record<AppRoute, AnalyticsRouteType>` 建立穷尽映射，未来增加 `AppRoute` 时会得到类型检查提醒。

### 3. URL sanitizer

- 页面 URL 的清洗逻辑短小且位置明确：删除高基数 `board` 查询参数与 hash，同时保留 `utm_source` 等正常归因参数。
- 使用平台 `URL`/`URLSearchParams` API，避免手写字符串解析与编码错误；相同清洗结果同时用于 `page_location` 和 `page_path`。
- 当前只有一个敏感 URL 参数，尚不值得引入额外抽象；隐私回归测试直接覆盖删除与保留两侧行为。

### 4. 测试隔离与稳定性

- Analytics 单元测试分别覆盖缺少 `gtag`、普通业务事件显式参数、page-view 字段映射，并在每个用例后清理 `window.gtag`。
- App 测试通过统一的 `pageViewParameters` helper 只筛选目标事件，避免被 GA4 初始化或后续业务事件干扰。
- StrictMode 测试使用真实 `<StrictMode><App /></StrictMode>` 入口，并同时断言首屏去重和非连续返回导航，防止用全局永久集合实现错误去重。
- 详情路由使用参数化测试覆盖 Pokémon 与 declaration 两类稳定路由类型；Picker URL 测试覆盖高基数参数泄漏回归。

### 5. 命名、风格与复杂度

- 名称与项目现有路由术语、GA4 字段语义一致；新增逻辑局部化，未引入依赖或状态框架。
- 实现保持 Task 1 边界，没有提前接入 Task 2–4 的业务事件调用点。
- 未发现阻塞级、重要级或建议修复级质量问题。

## 独立验证

```powershell
npx vitest run src/lib/analytics.test.ts src/App.test.tsx -t "analytics|tracks one initial page view|deduplicates the StrictMode|uses a stable route type|removes a Picker board"
```

结果：退出码 0；2 个测试文件通过，8 个目标测试通过，11 个无关测试跳过。

Task 1 可进入提交与下一任务。
