# Task 4 需求符合性评审

**最终结论：PASS**

## 复审结果

首次评审发现的 stale script 永久 pending 问题已修复：

- `src/lib/tally.ts:35-69` 为新建或已有脚本建立统一的事件与 8 秒超时生命周期。
- `load` 成功、`load` 后缺少 API、`error` 和 timeout 四条终止路径都会清理 `load` / `error` listener 和 timer。
- 失败路径会移除失效脚本；`src/lib/tally.ts:71-74` 会重置 single-flight promise，使之后的用户点击可以重建加载流程。
- 使用单次 `setTimeout` 提供失败上限，没有轮询。
- `src/lib/tally.test.ts:138-167` 验证预存 stale script 在 8 秒后 reject、被移除，并且第二次加载使用新脚本成功。
- `src/components/FeedbackButton.test.tsx:142-172` 验证 timeout 后显示本地化 `role="status"`、按钮恢复可用，并且第二次点击成功打开 Popup。

## 最终需求核对

- 缺失或空白 Form ID 时，两个入口均不渲染，不插入脚本。
- 脚本只在用户点击时懒加载；正常并发调用 single-flight，已有 `window.Tally` 直接复用，已有脚本处于加载中时复用同一标签。
- 脚本错误、加载后缺少 API、stale script timeout 均安全拒绝、完整清理且允许重试。
- hidden fields 运行时只复制 `page`、`route_type`、`pokemon_slug`、`language`、`mode`、`referrer`、`utm_source` 七个白名单键。
- App 上下文使用 pathname-only `page`、首个单值 `utm_source`、origin-only `referrer`；Pokémon slug 来自 canonical Pokémon 数据。
- `feedback_open` 只由 Tally `onOpen` 触发，`feedback_submit` 只由 `onSubmit` 触发。
- `onSubmit` 包装器完全忽略 Tally payload；GA4 不接收 Form ID、submission ID、answers、反馈正文或其他回调数据。
- GA4 事件只包含 route type、language、mode、source page 和可选 Pokémon slug。
- 全局入口位于 `<main>` 之后且独立于 Footer 条件，覆盖 Game 和 Explore。
- 声明成功面板提供 contextual CTA，并传递 canonical Pokémon slug。
- 加载失败展示本地化、可访问、非阻塞的状态，核心产品控件继续可用。
- 当前 Task 4 diff 未实现 Stats、metadata、静态 SEO 或其他 Task 5+ 行为。

## 验证证据

执行：

```powershell
npx vitest run src/lib/tally.test.ts src/components/FeedbackButton.test.tsx
```

结果：2 个测试文件通过，11 个测试全部通过。

结合首次评审已通过的 App 聚焦测试，Task 4 的需求、恢复性、隐私边界和范围边界均有直接证据支持。
