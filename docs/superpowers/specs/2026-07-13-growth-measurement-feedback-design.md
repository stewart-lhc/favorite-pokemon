# Favmon 增长数据、反馈与核心 SEO 优化设计

**日期：** 2026-07-13
**状态：** 已批准
**范围：** 首批增长优化，不批量改写 1,025 个 Pokémon 详情页

## 1. 背景与问题

近 28 天 GSC 数据显示 Favmon 的自然搜索点击率较高，但搜索覆盖面较窄；流量高度集中在“favorite Pokémon declaration”相关意图，`/stats`、`/pokedex`、单只 Pokémon 详情页等深层页面尚未形成稳定搜索入口。

GA4 同时显示自然搜索已是主要获客渠道，但当前应用只有基础 GA4 初始化：SPA 路由切换不会可靠地产生新的 `page_view`，声明、分享、Picker、Game 等关键行为也没有业务事件，无法判断用户是否真正完成核心动作。

站点已有实时社区数据和 1,025 个详情页。现阶段的主要矛盾不是 URL 数量不足，而是：

- 缺少从访问到声明、分享、反馈的可观测漏斗；
- `/stats` 有真实数据，但样本口径、模式和方法说明不够明确；
- 排名、最新声明与 Pokémon 详情页之间的内链不足；
- 静态 SEO HTML 与客户端 metadata 存在双份配置，需要同步维护；
- 缺少可关联页面上下文的用户反馈入口。

## 2. 目标与非目标

### 2.1 目标

1. 建立可靠、隐私友好的 GA4 行为数据闭环。
2. 使用 Tally 提供全站和声明成功场景的免费反馈入口。
3. 把 `/stats` 升级为可解释、可抓取、可向详情页传递权重的社区排行页。
4. 用低风险方式强化首页、`/explore`、`/game` 与详情页之间的搜索表达和内链。
5. 使用 TDD、顺序 subagent 实施和逐项评审控制回归风险。

### 2.2 非目标

- 不批量生成或改写 1,025 个 Pokémon 详情页的通用文案。
- 不新增 `/type/*`、`/generation/*`、`/ranking/*` 等目录页。
- 不宣称 Favmon 数据代表全球或全体 Pokémon 玩家。
- 不重构 `/pokedex` 的卡片与 Modal 交互。
- 不在本批引入 Microsoft Clarity 或其他会扩大隐私范围的行为录制工具。

## 3. 方案选择

### 方案 A：聚焦增长包（采用）

同步完成 GA4、Tally、`/stats`、关键内链和 metadata 对齐。该方案既能获得可测量数据，也能直接改善已有搜索机会，收益与改动风险最平衡。

### 方案 B：数据优先

只做 GA4 和反馈。风险最低，但不能直接解决深层页面缺少内链和搜索表达的问题。

### 方案 C：全站 SEO 扩建

同时重写所有核心页和详情页模板。改动面大、验证周期长，并可能进一步增加同质化薄内容，因此本批不采用。

## 4. 总体架构

实施拆为三个相互独立、按顺序交付的子系统：

1. **Analytics 基础与业务事件**：统一封装 `gtag`，负责 SPA 页面浏览和核心业务事件。
2. **Feedback 入口**：统一加载 Tally Popup，以白名单隐藏字段传递页面上下文，并把打开、提交回调映射到 GA4。
3. **SEO 增长页**：增强 `/stats` 的可见内容、内链和静态 fallback，同时对齐首页与 `/game` metadata。

三个子系统共用现有 `App.tsx` 路由、语言和 mode 状态，不引入新的全局状态框架。

## 5. Analytics 设计

### 5.1 基础模块

新增 `src/lib/analytics.ts`：

- 提供带类型约束的 `trackEvent` 和 `trackPageView`；
- `window.gtag` 不存在时安全 no-op，不能影响产品行为；
- 对参数进行显式构造，不允许把整个业务对象直接传入；
- 页面事件统一包含 `page_location`、`page_path`、`page_title`、`language`、`route_type`。

`index.html` 中关闭 GA4 自动首屏 `page_view`，由 React 路由 effect 统一发送首屏和后续 SPA 页面浏览，避免重复计数。

### 5.2 业务事件

首批事件如下：

| 事件 | 触发时机 | 关键参数 |
| --- | --- | --- |
| `declaration_submit_success` | 后端创建声明成功后 | Pokémon ID/slug、mode、language、fan count、revealed count |
| `share_card_download` | 浏览器已发起卡片下载 | Pokémon、format、art style、shiny |
| `share_link_click` | 原生分享成功、复制成功或平台外链意图 | method、platform、Pokémon |
| `picker_export` | Picker 复制或分享成功 | export method、已填槽位、team 状态、shiny |
| `game_round_complete` | 一轮答案判定完成 | correct、streak before/after、双方 Pokémon ID |
| `feedback_open` | Tally Popup 实际打开 | route type、language、mode、Pokémon slug |
| `feedback_submit` | Tally 返回提交回调 | route type、language、mode、Pokémon slug |

### 5.3 隐私与准确性

禁止发送：训练家姓名、声明理由、反馈正文、Tally submission ID、Declaration ID、完整 Picker board 查询参数。

事件必须描述已经发生的事实：

- 声明只在 API 成功后记录；
- 原生分享取消或抛错不记成功；
- Clipboard 写入失败不记成功；
- 平台外链只表示点击意图；
- 下载只表示浏览器已发起下载，不表示用户完成保存。

## 6. Tally 反馈设计

新增独立反馈入口，而不是只放在 Footer：

- 全局悬浮按钮位于主内容之后，覆盖 `/game`、`/explore` 等不渲染 Footer 的页面；
- 声明成功面板提供第二个上下文入口；
- 使用 `VITE_TALLY_FEEDBACK_FORM_ID` 配置公开 Form ID；未配置时不渲染入口；
- 动态加载 `https://tally.so/widgets/embed.js`，加载失败时不能阻塞应用；
- 使用 Popup API 的 `onOpen`、`onSubmit` 回调发送 GA4 事件。

隐藏字段采用固定白名单：

- `page`
- `route_type`
- `pokemon_slug`
- `language`
- `mode`
- `referrer`
- `utm_source`

不会把反馈正文或表单字段再转发到 GA4。

## 7. SEO 与内容设计

### 7.1 `/stats`

`StatsPage` 接收并显示当前 `mode`，明确区分 Favorite 和 Least-favorite 社区样本。

页面新增或调整：

- H1 聚焦 “Most Popular Pokémon / Live Favmon Community Rankings” 搜索意图；
- H1 下增加样本量、已获得声明的 Pokémon 数、社区样本口径、基础资料来源和更新方式；
- 排名数据先过滤 `votes > 0`，不让零票条目进入 Top 10/Top 25；
- Top 10、完整榜单、最新声明中的 Pokémon 名称链接到本地化 canonical 详情页；
- 保留 Favorite / Least-favorite 切换后的准确文案，不混淆两套数据。

### 7.2 首页与 `/explore`

最新声明中的 Pokémon 名称增加详情页内链，建立从首页和社区内容流到深层详情页的抓取路径。本批不新增筛选系统。

### 7.3 Metadata 与静态 fallback

同时修改客户端路由 SEO 配置和 `scripts/seo-config.mjs`，避免静态 HTML 与 hydration 后标题不一致。

英文目标表达：

- 首页：`Declare & Rank Your Favorite Pokémon | Favmon`
- `/stats`：`Most Popular Pokémon — Live Community Rankings | Favmon`
- `/game`：`Guess Which Pokémon Is More Popular | Favmon`

`/stats` 构建期 fallback 增加页面用途、社区样本口径、模式说明和更新时间机制，但不在没有数据库快照时伪造实时票数或 Top 10。

### 7.4 `/pokedex` 与详情页边界

`/pokedex` 本批保留现有搜索、排序、分页和 Modal 交互，只作为 `/stats` 和 fallback 中的重要导航目标。

详情页已有 canonical、FAQ、相关 Pokémon、社区数据和 CTA。本批通过真实有票榜单向它们传递内链，不批量增加通用段落。详情页模板增强留到获得新一轮 GSC 数据后单独设计。

## 8. 错误处理

- Analytics 或 Tally 不可用时，声明、下载、分享、Picker、Game 等产品流程必须继续工作。
- Tally Form ID 缺失时不显示入口，不生成死链接。
- Tally 脚本只加载一次；重复点击期间不能重复插入脚本。
- 排名无数据时使用现有空状态，不展示误导性的零票榜单。
- 构建期静态页面不依赖运行时 API 成功。

## 9. 测试策略

所有实现遵循 RED → GREEN → REFACTOR：

1. `src/lib/analytics.test.ts`：验证 `gtag` 存在和缺失两种路径、事件名及参数。
2. `src/App.test.tsx`：验证 SPA `page_view`、声明成功/失败、Picker 分享、Game 正误回合。
3. Tally 测试：验证 Form ID 缺失、Popup 打开、提交回调、隐藏字段白名单和脚本失败降级。
4. `/stats` 测试：验证 mode 说明、样本口径、非零票过滤、详情链接、canonical 和 title。
5. 构建产物检查：验证 `_seo/stats.html`、`_seo/game.html`、详情页 canonical 和 sitemap URL 数量。

最终门禁：

```powershell
npm test
npm run lint
npm run build
npm run check
git diff --check
```

## 10. Subagent 开发与评审顺序

1. Analytics 基础、SPA 页面浏览和业务事件。
2. Tally 反馈组件与事件。
3. `/stats`、内链、metadata 和静态 fallback。
4. 独立最终代码评审、完整测试与构建验证。

同一时刻只允许一个实现 subagent 修改代码。每个任务完成后先进行需求符合性评审，再进行代码质量评审；发现问题返回原 subagent 修复后才能进入下一任务。

## 11. 验收标准

- 所有首批事件在正确成功边界触发，且不包含禁止字段；
- 首屏及 SPA 路由切换各产生一次正确 `page_view`；
- 配置真实 Tally Form ID 后，全局和声明成功入口均可打开并提交；
- `/stats` 明确 mode、样本量与社区口径，排名不包含零票 Pokémon；
- 排名和最新声明向 canonical Pokémon 详情页提供可抓取链接；
- 客户端与构建期 metadata 一致；
- 全部自动化检查和构建产物检查通过；
- `main` 不被直接修改，最终变更保留在 `codex/growth-measurement-feedback` 分支供合并。
