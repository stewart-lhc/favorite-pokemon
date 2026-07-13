# Task 4 代码质量重审

**最终结论：PASS**

## 审查范围

- `src/lib/tally.ts`
- `src/lib/tally.test.ts`
- `src/components/FeedbackButton.tsx`
- `src/components/FeedbackButton.test.tsx`
- `src/App.tsx` 中 Tally context 与两个入口的接线
- `src/App.test.tsx` 中 Game / Explore 与声明成功场景
- `src/vite-env.d.ts`
- `src/styles.css` 中反馈按钮和失败状态样式
- Task 4 brief 与已通过的需求符合性报告

## 质量核对

### Loader 生命周期与恢复性

- `src/lib/tally.ts:28-75` 使用模块级 `loadPromise` 实现 single-flight；并发调用共享同一 Promise，不会重复插入脚本。
- 已存在 `window.Tally` 时立即复用；已存在同 URL 脚本但 API 尚不可用时，复用该节点并等待其终止信号。
- `load`、`error`、缺少 API 和 8 秒 timeout 都经过统一 cleanup：移除 `load` / `error` listener 并清理 timer。
- 所有失败路径都会移除失效脚本，Promise 的 rejection handler 会把 `loadPromise` 重置为 `null`，因此下一次点击可干净重试。
- timeout 后到达的迟发事件不会再进入旧 handler；当前实现不存在旧请求清除新请求 timer、旧 Promise 覆盖新 Promise或重复 settle 的竞态。

### 组件生命周期、可访问性与降级

- `src/components/FeedbackButton.tsx:35-72` 只禁用反馈按钮本身；Tally 加载失败不会阻塞其他产品操作。
- 缺失或空白 Form ID 时直接返回 `null`，不会产生 DOM 入口或提前加载脚本。
- 失败信息使用本地化文本和 `role="status"`；按钮具有可见文本、装饰图标 `aria-hidden`、44px 最小高度与清晰的 `:focus-visible` 样式。
- 异步操作最长由 loader 限制为 8 秒。组件 unmount 后 `catch` / `finally` 可能触发的 state update 会被 React 忽略，不会写入全局状态或重新挂载组件，因此不是当前行为缺陷；如果以后 loader 改为无上限等待，可再引入 mounted guard 或取消信号。

### 隐私、类型与事件隔离

- `sanitizeHiddenFields` 在运行时逐键复制七个允许字段，额外对象键不会透传。
- App 侧 `page` 只取 `window.location.pathname`，`utm_source` 只取首个单值，`referrer` 只取可解析的 origin，Pokémon slug 来自 canonical Pokémon 数据查找。
- `feedback_open` 只由 Tally `onOpen` 触发；`feedback_submit` 的包装函数不声明也不转发 Tally payload。
- GA4 context 仅包含 route type、language、mode、source page 和可选 Pokémon slug；Form ID、submission ID、answers、反馈正文和 referrer / UTM 均不会进入 GA4。
- `src/vite-env.d.ts` 将 Form ID 声明为可选环境变量，并将 Tally callback payload 显式设为 `unknown`，生产代码没有硬编码 editor URL。

### 接线与测试覆盖

- 全局入口位于 `<main>` 之后且不受 Footer 条件控制，覆盖 Game 和 Explore；声明成功入口使用 contextual variant 并传入 canonical slug。
- adapter 测试覆盖缺失 ID、single-flight、已有 API、error retry、缺少 API、allowlist、payload isolation、stale script timeout 与 retry。
- component 测试覆盖入口隐藏、回调时机、GA4 payload 隔离、可访问失败状态、timeout 后恢复和重试。
- App 测试直接验证 Game pathname / referrer / 首个 UTM 的净化、Explore 入口存在，以及声明成功时的 canonical `pikachu` context。
- 需求评审已执行聚焦测试：2 个测试文件、11 个测试全部通过。此次重审环境的 PowerShell 进程启动持续超时，未重复运行全量命令；结论基于逐行源码复审、测试源码与已有独立执行证据。

## 阻断问题

无。
