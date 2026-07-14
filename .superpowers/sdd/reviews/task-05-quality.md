# Task 05 代码质量最终复审

## 结论

**PASS**

上一轮发现的跨模式请求竞态已修复；结合原 4 项整改，当前 Task 05 未发现需要继续阻止提交的质量问题。

## 跨模式竞态复核

- `requestBackendData(requestMode, clearExisting)` 统一承载 initial、mode effect 和 manual Refresh 三类后端读取；每次请求分配单调递增的 generation（`src/App.tsx:3536-3559`）。
- success、catch、finally 都检查当前 generation：过期成功不能提交 Stats/Latest，过期失败不能覆盖错误状态，过期 finally 不能错误解除当前请求的 loading（`src/App.tsx:3547-3557`）。
- mode effect 的 cleanup 和 `toggleMode` 都立即递增 generation，使点击模式切换后仍在途的旧 Refresh 立刻失效（`src/App.tsx:3561-3566`, `3737-3740`）。
- 新 mode 通过 `clearExisting: true` 清除上一模式 Stats/Latest；新模式请求失败时展示真实 0 票空状态，不会把 Favorite 数据冒充 Least-favorite。Manual Refresh 使用 `clearExisting: false`，同模式失败仍保留原数据（`src/App.tsx:3539-3543`, `3562`, `3568-3570`）。
- 逆序完成测试先让 Least-favorite 的 9 票响应成功，再让旧 Favorite Refresh 的 99 票响应完成，并断言旧响应未覆盖新模式（`src/App.test.tsx:446-507`）。
- 新模式失败测试从已有 Favorite 数据切至失败的 Least-favorite 请求，断言旧 Pikachu/声明消失且显示两个空榜状态（`src/App.test.tsx:509-538`）。

## 原 4 项最终状态

- **PASS — 稳定来源文案：** Stats 的基础 locale 使用 Favmon 社区提交作为来源，不在新增方法说明中暴露数据库供应商。
- **PASS — 真实 Refresh：** 当前 mode 被传给统一读取函数；pending、成功、失败及按钮恢复均有明确状态边界，失败不破坏同模式旧数据。
- **PASS — 双模式空榜：** Top 10 与 Full Ranking 使用本地化空状态；Full Ranking 不渲染空表格，Favorite / Least-favorite 均有覆盖。
- **PASS — 异步测试稳定性：** 后端依赖断言等待真实异步内容，没有用放大 timeout 代替状态等待。

## 兼容性与其余质量检查

- `loadBackendData(mode, options = {})` 保留 fail-soft 默认；只有 `{ throwOnError: true }` 才抛出，默认调用契约兼容。
- 排名先过滤正票再排序和切片，不修改传入 `pokemon`；Map/canonical localized anchors 与 `BarChart` 可选链接行为保持正确。
- least 模式文案、方法说明、移动端样式和 Task 05 范围未发现新回归。

## 验证证据

- 按本轮要求只做静态独立复核，未重复运行慢速整套测试。
- 进度账本记录 Race RED 后 focused GREEN：逆序成功与新模式失败 2 个场景通过，39 个无关测试跳过。
- 扩展 focused：backend 兼容、Task 05 原场景及竞态回归共 **15 tests PASS**。
- 进度账本记录 `npm run lint`、`npx tsc -b`、`git diff --check` 均通过。
