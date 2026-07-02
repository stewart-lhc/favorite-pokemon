# Favorite Pokemon

Favmon 是一个独立的 Pokemon 社区声明网站，当前 canonical 域名为 `https://favmon.com/`。

## 功能

- 声明自己最喜欢或最不喜欢的 Pokemon，并写入本项目自己的 Neon Postgres。
- 提交声明后生成公开声明页和可下载、可分享的 Pokemon card，支持 Official Art / Pixel Art、Shiny、Square / Story / Banner 三种尺寸；卡片生成后可通过原生分享发送图片，并提供 X、Reddit、Bluesky、Threads、Facebook、WhatsApp、Telegram、LinkedIn、Pinterest、Tumblr、LINE、Email、复制链接和复制文案入口。
- 每只 Pokemon 都有独立详情页：canonical URL 为 `/pokemon/:slug`，支持从 Pokédex modal 深入查看粉丝数、排名、属性、世代、最新宣言和相关 Pokemon；详情页 CTA 会带 `?pokemon=:slug` 回到宣言表单并自动预选。
- Pokemon 详情页的多语言前缀用于用户体验和分享入口；SEO canonical 统一指向英文 slug URL，Vercel 对多语言详情页返回 `X-Robots-Tag: noindex, follow`，避免为相同 Pokemon 数据生成大量低差异重复索引页。
- 浏览 Explore、Pokédex、Stats、Game 五个核心页面。
- 新增 `/picker` 选择板页面：按世代、属性和 6 个队伍槽选择最喜欢的 Pokemon，支持闪光预览、本地保存、导入和导出备份代码。
- 支持基于 Google Trends Pokemon Topic 地区热度扩展的多语言入口：日语、韩语、简体中文、繁体中文、英文、西语、法语，以及智利/波多黎各/哥斯达黎加等地区西语入口；按语言加载对应的游戏化字体；支持 Favourite/Not My Favourite 模式切换。
- 使用 PokéAPI 同步 1025 只 National Dex Pokemon 的真实名称、类型，并本地缓存常用静态图片资源。
- 通过 Vercel API 读取 Neon 的真实声明、票数和最新列表；不读取源站 Supabase，也不生成随机/mock 票数。

## 数据来源

- Pokemon 基础数据：`public/data/pokemon.json`，由 `npm run sync:pokemon` 从 PokéAPI 拉取生成。
- 图片：pixel sprite、属性图标和 official artwork WebP 缓存在 `public/pokemon/`；仅 Shiny 分享图按需使用 PokeAPI sprites 仓库 URL。
- 用户声明和票数：Neon Postgres `declarations` 表，统计 view 为 `pokemon_stats` 和 `pokemon_stats_not_favourite`。
- 公开声明页：`/declaration/:id` 通过 Vercel API 按声明 id 读取同一张 `declarations` 表，并返回该 Pokemon 的当前粉丝数、排名、图鉴覆盖数和总声明数。
- Pokemon 详情页：`/pokemon/:slug` 复用 `public/data/pokemon.json`、全站统计和 `/api/declarations?pokemonId=:id`，不新增后端表或写入路径。
- 本机浏览器只保存“这个设备是否已经提交过”的标记，不保存声明作为榜单数据。

## 本地开发

```powershell
npm install
npm run sync:pokemon
npm run pokemon:assets
npm run dev -- --port 3001
```

本地 API 需要配置 `DATABASE_URL`，指向 Neon Postgres。schema 在 `db/schema.sql`。

## 验证

```powershell
npm run check
```

`npm run check` 会运行 Vitest 测试和生产构建。

## 品牌与 SEO 资产

```powershell
npm run seo:assets
npm run brand:assets
npm run pokemon:assets
```

`npm run seo:assets` 会从 `scripts/seo-config.mjs` 重新生成 `public/robots.txt`、`public/sitemap.xml`、`public/llms.txt`、`public/answers.md`、`public/pokemon-pages.md` 和 `public/pricing.md`。`npm run brand:assets` 会从 `scripts/generate-brand-assets.mjs` 重新生成网站 logo、favicon、PWA icon、Apple touch icon、Open Graph 图、Twitter Card 图和社交分发 banner。`npm run pokemon:assets` 会补齐本地 Pokemon sprite、属性图标和 official artwork WebP。

生产构建时会自动运行 SEO/AEO 生成流程：先生成 public 入口文件，再执行 Vite 构建，最后用 `scripts/generate-seo-routes.mjs` 为 `/picker`、`/game`、`/explore`、`/pokedex`、`/stats` 及各语言前缀生成带有独立 metadata、canonical、hreflang 和 JSON-LD 的静态 HTML，并为 1025 个 `/pokemon/:slug` canonical 详情页生成静态 HTML、FAQ JSON-LD 和数字 id alias。`public/sitemap.xml` 只列 canonical slug 详情页，不列多语言重复详情 URL；`public/pokemon-pages.md` 为 AI agent 提供完整详情页索引。

## 部署

Vercel 项目名使用 `favorite-pokemon`。生产环境必须配置 `DATABASE_URL`，并把 `favmon.com` 绑定到该项目。`vercel.json` 已配置：

- `www.favmon.com` 和旧 `favipokemon.vercel.app` 301 到 `https://favmon.com/`。
- `/robots.txt`、`/sitemap.xml`、`/llms.txt`、`/answers.md`、`/pokemon-pages.md`、`/pricing.md` 作为静态 SEO/AEO 文件直接返回。
- 核心页面和多语言页面优先返回 post-build 生成的 route-specific HTML；`/pokemon/:slug` 返回 post-build 生成的详情页 HTML；`/declaration/:id`、多语言声明详情页和多语言 Pokemon 详情页回退到 SPA，由前端按 id 或 slug 读取详情。

Vercel 已添加 `favmon.com` 和 `www.favmon.com` 到该项目。DNS 目标是：Spaceship 只保留 registrar 管理，先关闭 DNSSEC/移除 parent zone 的 DS 记录，再把 nameserver 切到 Cloudflare；Cloudflare DNS 使用橙云代理到 Vercel：

```text
A      favmon.com      76.76.21.21          Proxied
CNAME  www.favmon.com  cname.vercel-dns.com  Proxied
```

`www.favmon.com` 不在 Cloudflare 做跳转规则；请求进入 Vercel 后由 `vercel.json` 返回 301 到 `https://favmon.com/`。
