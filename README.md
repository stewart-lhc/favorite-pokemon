# Favorite Pokemon

这是对 `https://favoritepokemon.vercel.app/` 的独立复刻版，当前部署地址为 `https://favipokemon.vercel.app/`。

## 功能

- 声明自己最喜欢或最不喜欢的 Pokemon，并写入本项目自己的 Neon Postgres。
- 浏览 Explore、Pokédex、Stats、Game 五个核心页面。
- 支持英文/西语切换、Favourite/Not My Favourite 模式切换。
- 使用 PokéAPI 同步 1025 只 National Dex Pokemon 的真实名称、类型和图片 URL。
- 通过 Vercel API 读取 Neon 的真实声明、票数和最新列表；不读取源站 Supabase，也不生成随机/mock 票数。

## 数据来源

- Pokemon 基础数据：`public/data/pokemon.json`，由 `npm run sync:pokemon` 从 PokéAPI 拉取生成。
- 图片：PokeAPI sprites 仓库的 pixel sprite 和 official artwork URL。
- 用户声明和票数：Neon Postgres `declarations` 表，统计 view 为 `pokemon_stats` 和 `pokemon_stats_not_favourite`。
- 本机浏览器只保存“这个设备是否已经提交过”的标记，不保存声明作为榜单数据。

## 本地开发

```powershell
npm install
npm run sync:pokemon
npm run dev -- --port 3001
```

本地 API 需要配置 `DATABASE_URL`，指向 Neon Postgres。schema 在 `db/schema.sql`。

## 验证

```powershell
npm run check
```

`npm run check` 会运行 Vitest 测试和生产构建。

## 部署

Vercel 项目名使用 `favorite-pokemon`。生产环境必须配置 `DATABASE_URL`。`vercel.json` 已配置 SPA rewrite，直接访问 `/pokedex`、`/stats`、`/game` 等路径会回退到 `index.html`，但 `/api/*` 会保留给 Vercel Functions。
