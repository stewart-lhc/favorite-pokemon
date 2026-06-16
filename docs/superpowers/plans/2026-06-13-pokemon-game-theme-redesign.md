# Pokemon Game Theme Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变声明、图鉴、统计、探索、游戏、语言切换和模式切换功能的前提下，把全站重设计为更沉浸的 Pokemon 游戏迷体验。

**Architecture:** 保持当前 Vite + React 单页应用和 API/storage 边界不变，只改 UI 组件结构、真实素材露出和 CSS 主题系统。新增视觉素材优先使用已有 `public/pokeball.png`、`public/data/pokemon.json` 中的 sprite / official artwork URL，以及现有类型 icon URL，避免引入新数据源或破坏测试行为。

**Tech Stack:** React 19, Vite, TypeScript, lucide-react, CSS, Vitest, Playwright.

---

### Task 1: 锁定视觉方向与可变更边界

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/App.test.tsx` only if copy changes affect existing role/name assertions
- Modify: `README.md` only if user-facing run/verification notes become stale

- [ ] **Step 1: 保留功能边界**

保留这些行为不变：`loadBackendData(mode)`、`createBackendDeclaration(...)`、`loadPokemonDeclarations(...)`、`markDeclaredOnDevice(...)`、`mergePokemonStats(...)`、SPA route state、语言切换、Favourite / Not My Favourite 模式切换、下载 canvas 的格式/官方图/像素图/shiny 选项。

- [ ] **Step 2: 采用统一游戏视觉语言**

设计方向：
- 背景：掌机 RPG 的竞技场/地图氛围，使用网格、扫描线、能量光和深色图鉴面板。
- 导航：更像游戏 HUD，品牌改用真实 `pokeball.png`，保留当前链接和外链。
- 首页：声明表单变成 trainer console，hero 区展示真实 Pokemon party sprites/artwork。
- Pokédex：工具区和卡片变成图鉴屏幕，grid/list 仍保持现有交互。
- Stats：指标、排行榜和条形图变成 league board。
- Explore：保留 scroll-snap reel，提升为 battle spotlight。
- Game：保留二选一玩法，升级为 arena battle 视觉。

### Task 2: 修改 React 结构以增加真实素材和游戏感

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 新增轻量素材 helper**

增加常量和小组件：
- `featuredPokemonIds`：展示 Pikachu、Charizard、Bulbasaur、Squirtle、Eevee、Mewtwo。
- `PokemonAssetStrip`：渲染一排真实 pixel sprite。
- `PokemonShowcase`：在首页 hero 右侧展示当前选择或默认明星 Pokemon official artwork，并附带 sprite party。

- [ ] **Step 2: 升级页面结构但不改数据流**

在 `DeclarePage` 中：
- 用 `PokemonShowcase` 替换问号圆环。
- 给 hero、form、latest strip 添加游戏面板 class。
- 不改变表单字段、submit 条件、selector 行为、success panel 数据。

在 `PokedexPage`、`StatsPage`、`ExplorePage`、`GamePage` 中：
- 添加少量 wrapper/header class 或素材 strip。
- 不改变筛选、排序、分页、modal、bar chart、game choose 逻辑。

### Task 3: 全面重写 CSS 主题

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: 建立 Pokemon 游戏主题 token**

新增/调整 CSS 变量：
- 深色 `--game-ink`、面板 `--panel`、边框 `--panel-line`、高光 `--pokemon-yellow`、红色 `--pokemon-red`、蓝色 `--pokemon-blue`、草绿/紫色模式变量。
- 保持 `PokemonDPPro` 字体，同时补足系统 fallback。

- [ ] **Step 2: 重做全局布局和组件视觉**

覆盖：
- `body` 背景、固定 header、promo banner、nav links、buttons、inputs、selects、message。
- `declaration-hero`、`declaration-form`、`latest-card`、success/card downloader。
- `pokedex-tools`、`pokemon-card`、list row、modal。
- `metrics-grid`、`stats-section`、bar chart、table。
- `explore-container`、`reel-item`。
- `game-page`、`game-card`、game over overlay。

- [ ] **Step 3: 响应式验收**

确保 900px、700px、520px 断点下：
- header 不遮挡主体。
- hero 和 form 不重叠。
- Pokédex 工具区可堆叠。
- Game 两张卡在手机上纵向排列。

### Task 4: 测试和视觉验收

**Files:**
- Create: `.tmp/screenshots/*.png` through verification scripts only
- Modify: `design-qa.md` if Product Design QA cannot be fully satisfied because no selected visual mock exists

- [ ] **Step 1: 运行自动化验证**

Run: `npm test`
Expected: 4 test files pass, 11 tests pass.

Run: `npm run build`
Expected: TypeScript build and Vite production build exit 0.

- [ ] **Step 2: 启动本地服务**

Run: `npm run dev -- --port 3001`
Expected: Vite binds to `0.0.0.0:3001`.

- [ ] **Step 3: Playwright 截图检查**

Capture:
- `http://localhost:3001/`
- `http://localhost:3001/pokedex`
- `http://localhost:3001/stats`
- `http://localhost:3001/game`
- desktop 1440x1200 and mobile 390x844 for key routes.

Expected:
- 页面非空。
- 主要文本、按钮、表单、卡片无明显重叠。
- Pokemon 素材真实显示。
- 路由仍可导航。

### Task 5: 收尾

**Files:**
- Modify: `README.md` only if verification/dev-server instructions changed

- [ ] **Step 1: 检查文档是否需要更新**

如果功能、命令、部署方式不变，README 不改；最终报告明确 README/changelog/release notes 未改的原因。

- [ ] **Step 2: 汇总交付**

报告：
- 改动文件。
- 测试/build/截图验证结果。
- 本地访问 URL：`localhost` 和物理 WLAN/LAN IP。
- 当前分支与未提交状态。
