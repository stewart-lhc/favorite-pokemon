# Pokemon 详情页实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 为 Favmon 增加每只 Pokemon 的独立详情页，让用户可以从搜索、分享、图鉴和站内链接直接进入某只 Pokemon 的社区档案，并低摩擦地回到宣言动作。

**Product Design:** 目标行为是让访客看完某只 Pokemon 的人气、排名和最新宣言后继续提交自己的选择。页面使用清晰的社会证明（粉丝数、排名、最新理由）和低摩擦 CTA（带预选 Pokemon 的宣言入口），保留 Pokédex modal 作为快速浏览，不替换现有高频操作。

**Architecture:** Canonical URL 使用英文 slug：`/pokemon/:slug`。前端同时接受带 locale 前缀的 `/:locale/pokemon/:slugOrId`，并可解析数字 id。SEO 首版只把 canonical slug 页放入 sitemap 和静态 prerender 文档，避免一次性制造大量低差异多语言详情页。

**Tech Stack:** React 19, Vite 8, TypeScript, Vitest, Testing Library, Vercel rewrites, existing Neon declaration API。

---

### Task 1: 路由和 SEO 契约

**Files:**
- Modify: `src/App.tsx`
- Modify: `vercel.json`
- Modify: `scripts/generate-seo-assets.mjs`
- Modify: `scripts/generate-seo-routes.mjs`

- [x] **Step 1: 扩展应用路由**

加入 `/pokemon` 应用路由、`pokemonSlug` location 字段、localized/absolute Pokemon URL helper、canonical/alternate 规则。

- [x] **Step 2: 支持直接访问**

让 `/pokemon/:slugOrId` 与 `/:locale/pokemon/:slugOrId` 都能进入 SPA；生产环境对 canonical slug/id 输出静态 SEO 文档。

- [x] **Step 3: 更新 sitemap**

把 1025 个 canonical `/pokemon/:slug` 加入 `public/sitemap.xml`，不把所有 locale 详情页加入首版 sitemap。

### Task 2: Pokemon 详情页体验

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

- [x] **Step 1: 构建详情页主体**

展示官方立绘、sprite、编号、世代、属性、当前模式粉丝数、排名、图鉴覆盖和最新宣言。

- [x] **Step 2: 设计行为 CTA**

主 CTA 跳转到宣言表单并通过 query 预选当前 Pokemon；次 CTA 回到 Pokédex 和 Stats。

- [x] **Step 3: 添加相关 Pokemon**

展示同世代或同属性的相关 Pokemon 链接，帮助用户继续浏览长尾详情页。

### Task 3: 入口和表单预选

**Files:**
- Modify: `src/App.tsx`

- [x] **Step 1: Pokédex modal 增加详情页链接**

保持卡片点击打开 modal，在 modal 内增加当前 Pokemon 的详情页入口。

- [x] **Step 2: 宣言表单支持预选**

当 URL 包含 `?pokemon=:slugOrId` 时，自动填入选择器和展示区，不覆盖用户已手动选择的 Pokemon。

### Task 4: 测试和验收

**Files:**
- Modify: `src/App.test.tsx`

- [x] **Step 1: 增加详情页测试**

覆盖 `/pokemon/pikachu` 直接访问、modal 详情页链接、`/?pokemon=pikachu` 预选行为。

- [x] **Step 2: 跑完整验证**

Run: `npm test`, `npm run lint`, `npm run build`
Expected: tests pass, lint clean, production build generates SEO assets and prerendered Pokemon detail documents.
