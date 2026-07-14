# Task 05 需求符合性复审

## 结论

**PASS**

当前未提交 diff 满足 Task 05 需求。最新 P1 跨模式竞态整改使用统一、单调递增的 request generation；旧模式请求的成功、失败和 `finally` 均不能再写入新模式状态。

## P1 跨模式请求隔离

- 初始/模式 effect 与手动 Refresh 都调用同一个 `requestBackendData(requestMode, clearExisting)`（`src/App.tsx:3536-3569`）。
- 每次请求先取得新的单调递增 generation。成功写入 `stats`、`declarations`、清理错误前检查 generation；失败写入错误前也做相同检查；`finally` 只有仍是当前 generation 时才解除 `backendLoading`（`src/App.tsx:3537-3557`）。因此旧请求无论成功、失败或最后结束，都不能覆盖新模式数据、错误或 loading 状态。
- `toggleMode` 在切换 state 前立即递增 generation，effect cleanup 也会递增 generation；待处理的旧模式 Refresh/首载请求会立刻失效（`src/App.tsx:3561-3566`, `3737-3740`）。
- 新模式 effect 使用 `clearExisting: true`，在请求前清空上一模式的 Stats、Latest 和旧错误。即使新模式请求失败，页面也会显示真实的 0 数据/空榜，而不会在 Least-favorite 标题下继续展示 Favorite 排名（`src/App.tsx:3539-3544`, `3561-3566`）。
- 同模式手动 Refresh 使用 `clearExisting: false`。请求失败只更新错误，原 `stats` 与 `declarations` 保留；当前 generation 的 `finally` 会解除 loading，`StatsPage` 自己的 `finally` 同时解除 `refreshing`（`src/App.tsx:3547-3557`, `3568-3570`, `6055-6062`）。

## 其余 Task 05 需求

- `StatsPage` 接收当前 `mode`，Favorite / Least-favorite 的 H1 和说明明确为 Favmon community ranking，不宣称 global/worldwide。
- 七个独立基础 locale 均有模式、社区样本、稳定的 Favmon 社区提交来源、PokéAPI 归属、真实 Refresh 说明和空榜文案；区域 locale 沿用原继承机制。
- `rankedPokemon` 在 Top 10 / Top 25 切片前先过滤 `votes > 0`；coverage 仍使用完整 Pokédex 分母。
- Favorite 与 Least-favorite 无正票时，Top 10 和 Full Ranking 均显示本地化空状态；Full Ranking 不渲染空表。
- Top 10、Full Ranking、Stats Latest、首页 Latest 和 Explore Latest 均使用普通 `<a>` 与 `localizedPokemonPath` 生成 canonical/localized Pokémon 详情链接；ID 无法解析时保留原文本。
- 方法说明使用语义化 heading/paragraph；现有模式切换、图表、分页、声明流程未被替换。

## 静态复核与已有测试证据

- 本次按主代理要求没有启动任何测试，只复核当前 diff 与 progress。
- Progress 已记录 TDD RED：旧 Favorite Refresh 会在 Least-favorite 成功后反向覆盖；Least-favorite 加载失败会遗留 Favorite 的 22 票数据。
- Progress 已记录竞态 focused GREEN：逆序完成与新模式失败两个场景均通过。
- Progress 已记录扩展 focused GREEN：backend 默认兼容、Stats 社区口径、真实 Refresh 成功/失败、跨模式旧响应隔离、新模式失败清空、双模式空榜及 canonical 深链共 **15 passed，31 skipped**。
- Progress 已记录 `npm run lint`、`npx tsc -b`、`git diff --check` 通过；本次整改按要求未再启动 full suite。
- 上一轮本人合并 focused 命令曾遇到 PowerShell 65 秒外层超时，未将其计为通过或失败；随后更小的 Refresh/空榜组曾取得 4/4 GREEN。本轮不重复运行。

## 范围说明

Task 05 原 brief/计划的文件清单没有列出 `src/lib/backend.ts`。当前对它的修改仅增加 opt-in `throwOnError`，保留 `loadBackendData(mode)` 默认 fail-soft 契约，用于让 Refresh 区分请求失败和合法空数据。该改动未触及 brief 明确禁止的 metadata、静态 SEO、sitemap、详情页模板或新 URL 家族；判定为满足真实 Refresh 失败语义的最小必要范围偏差，不阻断 PASS。

## 最终门禁说明

此结论仅判定 Task 05 需求符合性，不宣称全量测试已 GREEN。最终合并仍应依据主代理的完整门禁结果处理既有 Picker restore 与 suite-load 波动。
