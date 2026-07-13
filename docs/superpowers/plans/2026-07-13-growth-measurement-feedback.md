# Favmon 增长数据、反馈与核心 SEO 优化实施计划

> **执行要求：** 使用 `Superpowers:subagent-driven-development` 顺序派发新 implementer；每个任务严格执行 RED → GREEN → REFACTOR，并在需求符合性评审和代码质量评审均通过后进入下一任务。

**目标：** 补齐 Favmon 的 SPA/业务事件数据闭环，接入带页面上下文的 Tally 反馈，并把 `/stats` 升级为可信、可抓取、可向真实有票详情页传递权重的社区排行增长页。

**架构：** 新增无副作用的 Analytics 与 Tally 适配层，在现有单页路由和业务成功边界调用；SEO 侧保留现有路由结构，只增强 `/stats` 的真实内容、链接和构建期 fallback，并同步运行时/静态 metadata。所有外部脚本失败均不得阻塞核心产品流程。

**技术栈：** React 19、TypeScript、Vite、Vitest、Testing Library、GA4 `gtag`、Tally Popup API、Node SEO 生成脚本。

**设计文档：** `docs/superpowers/specs/2026-07-13-growth-measurement-feedback-design.md`

---

## 执行纪律

- 工作分支：`codex/growth-measurement-feedback`
- 工作目录：`D:\GitHub\pokemon-worktrees\growth-measurement-feedback`
- 不直接修改 `main`。
- 同一时间只允许一个 implementer 修改代码。
- 每项测试必须先观察到与目标行为相关的失败，再实现生产代码。
- 每个任务完成时创建：
  - `.superpowers/sdd/briefs/task-XX-*.md`
  - `.superpowers/sdd/reviews/task-XX-requirements.md`
  - `.superpowers/sdd/reviews/task-XX-quality.md`
- 每次状态变化更新 `.superpowers/sdd/progress.md`。
- 禁止事件参数包含训练家姓名、声明理由、反馈正文、Tally submission ID、Declaration ID、完整 Picker board。

## Task 0：建立 SDD 账本并验证基线

**文件：**

- Create: `.superpowers/sdd/progress.md`
- Create: `.superpowers/sdd/briefs/task-00-baseline.md`

### Step 1：记录任务与门禁

在 progress ledger 中列出 Task 0–6、当前状态、提交 SHA、需求评审和质量评审状态。

### Step 2：确认依赖和干净基线

运行：

```powershell
npm test
npm run lint
npm run build
npm run check
git status --short
```

预期：现有分支只包含已提交的设计文档和未提交的计划/SDD 文档；测试、lint、build、check 均通过。如基线失败，先记录真实失败，不把它归因于后续实现。

### Step 3：提交计划与账本

```powershell
git add docs/superpowers/plans/2026-07-13-growth-measurement-feedback.md .superpowers/sdd
git diff --cached --check
git commit -m "docs: plan Favmon growth measurement implementation"
```

## Task 1：Analytics 基础与 SPA page_view

**文件：**

- Create: `src/lib/analytics.ts`
- Create: `src/lib/analytics.test.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `index.html`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Create: `.superpowers/sdd/briefs/task-01-analytics-pageviews.md`

### Step 1：写 Analytics 适配层失败测试

覆盖：

- `window.gtag` 不存在时不抛错；
- `trackEvent` 以 `event` 命令发送指定事件和显式参数；
- `trackPageView` 发送 `page_view`，包含 `page_location`、`page_path`、`page_title`、`language`、`route_type`；
- 参数对象不会被适配层自动追加业务对象或敏感字段。

运行：

```powershell
npx vitest run src/lib/analytics.test.ts
```

预期：RED，失败原因是模块尚不存在或导出尚未实现。

### Step 2：实现最小 Analytics 适配层

实现类型化事件名、基础参数类型和安全 no-op；只接受调用方显式构造的扁平参数。

再次运行目标测试，预期 GREEN。

### Step 3：写 SPA 页面浏览失败测试

在 `src/App.test.tsx` 中 mock `window.gtag`，覆盖：

- 首屏只发送一次 page view；
- 从首页导航到 `/stats` 后发送新的 `/stats` page view；
- `page_title` 与同步后的文档标题一致；
- language 和 route type 正确。

运行目标测试，预期 RED，因为应用尚未调用 `trackPageView`。

### Step 4：接管自动 page_view

- `index.html` 的 GA4 config 设置 `send_page_view: false`；
- 在现有 location/SEO effect 邻近位置增加 page view effect；
- 以规范化 route/detail route 计算 `route_type`；
- 更新 `src/vite-env.d.ts` 的 `gtag` 类型。

运行：

```powershell
npx vitest run src/lib/analytics.test.ts src/App.test.tsx
```

预期：GREEN，且没有首屏重复计数。

### Step 5：评审与提交

先需求评审，再质量评审；修复后运行：

```powershell
git diff --check
npm test
git add index.html src/App.tsx src/App.test.tsx src/lib/analytics.ts src/lib/analytics.test.ts src/vite-env.d.ts .superpowers/sdd
git commit -m "feat: track Favmon SPA page views"
```

## Task 2：声明与分享业务事件

**文件：**

- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/lib/analytics.ts`
- Modify: `src/lib/analytics.test.ts`
- Create: `.superpowers/sdd/briefs/task-02-declaration-sharing-events.md`

### Step 1：写声明成功边界失败测试

覆盖：

- `createBackendDeclaration` 成功后恰好发送一次 `declaration_submit_success`；
- API 失败时不发送；
- 参数只有 Pokémon ID/slug、mode、language、source page、fan count、revealed count；
- 不包含 trainer name、reason、declaration ID。

运行对应测试，确认 RED。

### Step 2：实现声明事件

仅在 `await createBackendDeclaration(...)` 成功并获得结果后调用 Analytics；不要在 submit 点击或 `form_start` 阶段记录成功。

### Step 3：写下载和分享失败测试

覆盖：

- 卡片下载发起后发送 `share_card_download`；
- 原生分享 resolve 后发送 `share_link_click`；
- `AbortError` 或 reject 不发送成功；
- Clipboard resolve 后发送，reject 不发送；
- 平台 anchor click 记录 `intent` 和平台，不宣称分享成功。

### Step 4：实现分享事件

在现有 `PokemonCardDownloader` 成功边界插入事件；不要改变现有下载、提示和 fallback 行为。

### Step 5：评审、回归与提交

```powershell
npx vitest run src/lib/analytics.test.ts src/App.test.tsx
git diff --check
git add src/App.tsx src/App.test.tsx src/lib/analytics.ts src/lib/analytics.test.ts .superpowers/sdd
git commit -m "feat: track declaration and sharing outcomes"
```

## Task 3：Picker 与 Game 事件

**文件：**

- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/lib/analytics.ts`
- Modify: `src/lib/analytics.test.ts`
- Create: `.superpowers/sdd/briefs/task-03-picker-game-events.md`

### Step 1：写 Picker 失败测试

覆盖：

- Clipboard 导出成功发送 `picker_export`；
- 原生分享成功发送 `picker_export`；
- Clipboard/native share 失败不发送成功；
- 参数包括 method、filled slots、team filled、shiny、language，不包含完整 board code。

### Step 2：实现 Picker 事件并跑 GREEN

事件放在现有异步成功边界，保持现有 UI 状态和 fallback。

### Step 3：写 Game 失败测试

使用确定性 pair/mocked random 或直接可控数据覆盖：

- 正确答案发送一次 `game_round_complete`，`correct=true`，streak 递增；
- 错误答案发送一次，`correct=false`，进入 game over；
- 参数包含双方 ID 和 streak before/after；
- 每轮只发送一次。

### Step 4：实现 Game 事件并跑 GREEN

在答案已经判定、状态更新前构造事实参数；不能由 render/effect 重复发送。

### Step 5：评审、回归与提交

```powershell
npx vitest run src/lib/analytics.test.ts src/App.test.tsx
git diff --check
git add src/App.tsx src/App.test.tsx src/lib/analytics.ts src/lib/analytics.test.ts .superpowers/sdd
git commit -m "feat: track picker exports and game rounds"
```

## Task 4：Tally 反馈入口与上下文

**文件：**

- Create: `src/lib/tally.ts`
- Create: `src/lib/tally.test.ts`
- Create: `src/components/FeedbackButton.tsx`
- Create: `src/components/FeedbackButton.test.tsx`
- Modify: `src/vite-env.d.ts`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`
- Create: `.superpowers/sdd/briefs/task-04-tally-feedback.md`

### Step 1：写 Tally 适配层失败测试

覆盖：

- Form ID 缺失时返回不可用状态，不插入脚本；
- 并发/重复调用只插入一个脚本；
- 脚本已存在时直接复用；
- 加载失败被安全捕获且允许之后重试；
- `openPopup` 只接收白名单 hidden fields。

### Step 2：实现脚本加载与 Popup 适配层

适配层只负责公开 Form ID、脚本生命周期、字段白名单和 Popup 调用；不直接依赖 React 状态。

### Step 3：写 FeedbackButton 失败测试

覆盖：

- 未配置 Form ID 时不渲染；
- 点击后打开 Popup；
- `onOpen` 发送 `feedback_open`；
- `onSubmit` 发送 `feedback_submit`；
- GA4 参数不包含表单字段或 submission ID；
- 脚本失败时不影响页面其他交互。

### Step 4：实现全局和声明成功入口

- 在主内容之后渲染全局悬浮按钮，不依赖 Footer；
- 在 `DeclarationSuccessPanel` 增加上下文 CTA；
- 上下文只允许 `page`、`route_type`、`pokemon_slug`、`language`、`mode`、`referrer`、`utm_source`；
- 添加响应式、键盘可达和 focus 样式。

### Step 5：核实 Tally Form ID

从现有已登录 Tally 表单核实公开 Form ID。若无法可靠读取，则保持代码支持 `VITE_TALLY_FEEDBACK_FORM_ID`、记录配置缺口，不猜测 ID。

### Step 6：评审、回归与提交

```powershell
npx vitest run src/lib/tally.test.ts src/components/FeedbackButton.test.tsx src/App.test.tsx
git diff --check
git add src/lib/tally.ts src/lib/tally.test.ts src/components/FeedbackButton.tsx src/components/FeedbackButton.test.tsx src/vite-env.d.ts src/App.tsx src/App.test.tsx src/styles.css .superpowers/sdd
git commit -m "feat: collect contextual Tally feedback"
```

## Task 5：`/stats` 社区排行、模式口径与深链

**文件：**

- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/styles.css`
- Create: `.superpowers/sdd/briefs/task-05-stats-growth-page.md`

### Step 1：写 `/stats` 内容和排名失败测试

构造至少三个有票 Pokémon、一个零票 Pokémon，覆盖：

- 新 H1 和 Favmon community sample 说明；
- Favorite mode 与 Least-favorite mode 口径同步变化；
- 显示总样本和已获得声明 Pokémon 数；
- Top 10/Full Ranking 不包含零票 Pokémon；
- 排名 Pokémon 指向 `/pokemon/:slug` 或对应本地化路径；
- Latest 声明 Pokémon 同样有详情链接；
- canonical 保持 `https://favmon.com/stats`。

运行目标测试，确认 RED。

### Step 2：实现真实样本结构

- 给 `StatsPage` 传入 `mode`；
- 新增本地化的 H1、样本说明、mode 说明、数据来源和更新方式；
- 先过滤正票再生成 Top 10/Top 25；
- 添加 canonical 详情链接；
- 不写“global/worldwide most popular”。

### Step 3：写首页和 `/explore` 内链失败测试

断言最新声明里的 Pokémon 名称链接到本地化 canonical 详情页。

### Step 4：实现低风险内链和样式

复用 `localizedPokemonPath`，不改变卡片主交互或声明详情路径。

### Step 5：评审、回归与提交

```powershell
npx vitest run src/App.test.tsx
npm test
git diff --check
git add src/App.tsx src/App.test.tsx src/styles.css .superpowers/sdd
git commit -m "feat: strengthen community ranking discovery"
```

## Task 6：Metadata、静态 fallback 与最终门禁

**文件：**

- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `scripts/seo-config.mjs`
- Modify: `scripts/generate-seo-routes.mjs`
- Add or Modify: relevant script tests if existing test structure permits
- Create: `.superpowers/sdd/briefs/task-06-static-seo.md`

### Step 1：写 metadata 失败测试

覆盖首页、`/stats`、`/game` 的目标 title/description，并断言社区样本口径准确。

目标英文 title：

- `Declare & Rank Your Favorite Pokémon | Favmon`
- `Most Popular Pokémon — Live Community Rankings | Favmon`
- `Guess Which Pokémon Is More Popular | Favmon`

### Step 2：同步双份 metadata

同时修改 `src/App.tsx` 和 `scripts/seo-config.mjs`。描述必须使用 `Favmon community declarations`，不得宣称全球权威。

### Step 3：写静态 fallback 失败检查

先构建或直接测试生成器，断言 `dist/_seo/stats.html` 包含：

- 新 title 和 canonical；
- Favmon community sample/methodology 文案；
- Favorite / Least-favorite 模式说明；
- `/pokedex`、`/explore` 和首页链接；
- 不包含伪造的实时 Top 10 数字。

### Step 4：实现 `/stats` 专用 fallback

在 `scripts/generate-seo-routes.mjs` 中为 `/stats` 输出专用正文；其他核心路由保持现状，避免扩大范围。

### Step 5：需求符合性和代码质量终审

终审必须逐条核对设计文档第 11 节，而不是只看测试是否通过。任何未证明项保持未完成状态。

### Step 6：运行完整验证

```powershell
npm test
npm run lint
npm run build
npm run check
git diff --check
Select-String -LiteralPath dist\_seo\stats.html -Pattern '<title>','rel="canonical"','Favmon community','/pokedex','/explore'
Select-String -LiteralPath dist\_seo\game.html -Pattern '<title>','rel="canonical"'
Select-String -LiteralPath dist\_seo\pokemon\pikachu.html -Pattern '<title>','rel="canonical"','FAQPage'
rg -c "<loc>" public\sitemap.xml
```

预期：所有命令退出码为 0；构建产物同时证明新核心页内容和现有详情页 SEO 未回归。

### Step 7：提交最终实现

```powershell
git add src/App.tsx src/App.test.tsx scripts/seo-config.mjs scripts/generate-seo-routes.mjs .superpowers/sdd
git diff --cached --check
git commit -m "feat: align Favmon growth SEO metadata"
git status --short --branch
```

## 完成审计清单

- [ ] `page_view` 首屏及 SPA 路由各一次，无重复。
- [ ] 7 个业务事件均在事实成功边界发送。
- [ ] Analytics 与 Tally 不可用时核心产品不受影响。
- [ ] 禁止字段没有进入任何 GA4 调用。
- [ ] 全局与声明成功反馈入口使用同一 Tally 适配层。
- [ ] `/stats` 明确 mode、样本、数据来源与更新时间机制。
- [ ] 零票 Pokémon 不进入排名。
- [ ] 排名、首页和 Explore 最新声明具有 canonical 详情链接。
- [ ] 运行时与静态 metadata 一致。
- [ ] `/stats` fallback 有可信说明且不伪造实时榜单。
- [ ] 自动化检查、构建和产物检查全部通过。
- [ ] 每项任务需求评审和质量评审报告齐全。
- [ ] 分支工作树干净，`main` 未被直接修改。
