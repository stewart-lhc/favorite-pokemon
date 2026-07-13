# Task 06 brief：Metadata、静态 fallback 与最终门禁

## 目标

同步 Favmon 核心增长页的客户端 metadata 与构建期静态 metadata，并为 `/stats` 输出可抓取、口径可信的静态正文。不得伪造运行时票数，也不得批量改写 1,025 个 Pokémon 详情页模板。

## 必须实现

### 运行时与静态 metadata

- 英文首页 title：`Declare & Rank Your Favorite Pokémon | Favmon`。
- 英文 `/stats` title：`Most Popular Pokémon — Live Community Rankings | Favmon`。
- 英文 `/game` title：`Guess Which Pokémon Is More Popular | Favmon`。
- 对应 `socialTitle` 使用相同或语义一致且不夸大的表达。
- 三个页面的英文 description 必须明确数据来自 `Favmon community declarations`；不得使用 global、worldwide、universal authority 等权威性误导表达。
- `src/App.tsx` 与 `scripts/seo-config.mjs` 中每个 locale/route 的 SEO 数据必须保持一致。未要求改写的本地化 title/description 可以保持原文，但两份配置不得漂移。
- 客户端导航后 `document.title`、description、canonical、Open Graph 和 Twitter metadata 继续由现有机制正确更新。

### `/stats` 静态 fallback

- `scripts/generate-seo-routes.mjs` 仅为 `/stats` 增加专用 fallback；其他核心 route 和 Pokémon 详情 fallback 不扩大改写范围。
- 英文 `/stats` fallback 必须包含：页面用途、Favmon community sample/methodology、Favorite 与 Least-favorite 两种模式的含义、数据在运行时加载且可用 Refresh 重新请求的准确说明。
- 必须包含可抓取的普通链接：`/`、`/pokedex`、`/explore`。
- 不得输出数据库供应商、虚构票数、虚构 Top 10、静态排名顺序或“全球最受欢迎”等断言。
- 构建期 fallback 不依赖 `/api/data` 或数据库成功。

### 回归边界

- 不新增 URL family，不修改 sitemap 路由集合。
- 不修改 Pokémon 详情页内容模板、FAQ 内容或 1,025 个页面的通用正文。
- 构建后现有详情页 canonical、FAQPage 与 sitemap URL 数量必须保持。
- `npm run build` 可能重写日期型 SEO 资产；只保留与本任务语义直接相关的生成文件变更，恢复纯日期噪音。

## TDD 与验证证据

1. 先在 `src/App.test.tsx` 为首页、`/stats`、`/game` 写 metadata RED，至少断言精确英文 title、社区口径 description 与 canonical。
2. 修改 `src/App.tsx` 与 `scripts/seo-config.mjs` 后取得 focused GREEN；静态/运行时同源重复仍需逐项核对。
3. 在实现专用 fallback 前先构建或用最小生成检查取得 RED：`dist/_seo/stats.html` 缺少 methodology、双模式、Refresh 与三个导航链接。
4. 实现后验证 `dist/_seo/stats.html` 包含新 title、canonical、`Favmon community`、Favorite、Least-favorite、Refresh、`/pokedex`、`/explore`，且不含伪造实时 Top 10 数据。
5. 运行 focused tests、`npm run lint`、`npx tsc -b`、`npm run build`、`git diff --check`，并把 RED/GREEN 与产物证据写入 progress。
6. 不提交；根代理会先做独立需求与质量评审，再执行最终整套验收。

## 文件范围

- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Modify: `scripts/seo-config.mjs`
- Modify: `scripts/generate-seo-routes.mjs`
- Add/Modify: 仅在现有结构适合时添加最小 SEO 配置/生成器测试
- Modify: `.superpowers/sdd/progress.md`
- 不修改详情页模板语义、外部 Tally 配置或部署环境。
