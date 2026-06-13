# Favorite Pokemon 克隆实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `D:\GitHub\pokemon` 独立实现并上线 `favorite-pokemon.vercel.app`，复刻源站的声明、探索、图鉴、统计、游戏、语言和模式切换体验。

**Architecture:** 使用 Vite + React + TypeScript 构建静态 SPA。PokeAPI 只用于读取公开 Pokemon 列表，声明数据保存在本机 `localStorage`，全局票数用可复现的种子算法生成，避免绑定或写入源站 Supabase。

**Tech Stack:** React 19, Vite 7, TypeScript, Vitest, Testing Library, Playwright, Vercel。

---

### Task 1: 测试优先搭好行为契约

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `src/test/setup.ts`
- Create: `src/lib/pokemon.test.ts`
- Create: `src/lib/storage.test.ts`
- Create: `src/App.test.tsx`

- [x] **Step 1: 写失败测试**

测试覆盖 Pokemon 数据装饰、声明持久化和页面导航。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test`
Expected: FAIL because `src/App`, `src/lib/pokemon`, and `src/lib/storage` do not exist yet.

### Task 2: 实现数据和持久化边界

**Files:**
- Create: `src/types.ts`
- Create: `src/lib/pokemon.ts`
- Create: `src/lib/storage.ts`

- [ ] **Step 1: 实现 Pokemon 装饰函数**

导出 `seededVoteCount`, `getGeneration`, `decoratePokemon`, `buildPokemonRows`。

- [ ] **Step 2: 实现声明存储函数**

导出 `saveDeclaration`, `getDeclarations`, `hasDeclaredOnDevice`, `clearDeclarations`。

- [ ] **Step 3: 运行单元测试**

Run: `npm test`
Expected: data and storage tests pass; app test may still fail until UI exists.

### Task 3: 实现 SPA 页面和样式

**Files:**
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles.css`
- Create: `src/vite-env.d.ts`
- Create: `public/manifest.json`

- [ ] **Step 1: 实现应用外壳**

Header, promo banner, footer, language toggle, favourite/not-favourite mode toggle.

- [ ] **Step 2: 实现五个页面**

Declare, Game, Explore, Pokédex, Stats page share the same seeded data and local declarations.

- [ ] **Step 3: 运行测试和构建**

Run: `npm run check`
Expected: Vitest passes and Vite production build succeeds.

### Task 4: 本地视觉验收

**Files:**
- No production file changes expected.

- [ ] **Step 1: 启动本地服务**

Run: `npm run dev -- --port 3001`
Expected: Vite serves on `0.0.0.0:3001`.

- [ ] **Step 2: Playwright 截图检查桌面和移动端**

Run desktop and mobile screenshots for `/`, `/pokedex`, `/stats`, `/game`.
Expected: content is nonblank, no obvious overlap, core pages match source layout closely.

### Task 5: GitHub 和 Vercel 上线

**Files:**
- Modify: Git metadata and Vercel project link files if the CLI creates them.

- [ ] **Step 1: 初始化 Git 并提交**

Run: `git init`, `git add .`, `git commit -m "feat: clone favorite pokemon site"`.

- [ ] **Step 2: 创建或绑定 GitHub 仓库并推送**

Run: `gh repo create favorite-pokemon --public --source . --remote origin --push` or push to existing remote if present.

- [ ] **Step 3: 创建 Vercel 项目并生产部署**

Run: `npx vercel --prod --yes --name favorite-pokemon`.
Expected: production deployment is reachable at `https://favorite-pokemon.vercel.app/`.

- [ ] **Step 4: 线上验收**

Run HTTP checks and Playwright screenshot against `https://favorite-pokemon.vercel.app/`.
Expected: production route returns 200 and renders the cloned app.
